// -----------------------------------------------------------------------------
// TechDesk AI — authentication & account routes
// -----------------------------------------------------------------------------
import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import {
  audit, isSecure, refreshSessions, resetTokens, settings, tenantById,
  userByEmail, userById, users, type LabUser, type Role,
} from "../lib/store";
import {
  hashPassword, makeResetToken, signAccessToken, verifyPassword,
} from "../lib/security";
import { requireAuth } from "../lib/context";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const publicUser = (u: LabUser) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, tenantId: u.tenantId,
  status: u.status, initials: u.initials, lastActive: u.lastActive,
  organization: tenantById(u.tenantId),
});

// INTENTIONAL-LAB-VULNERABILITY: profile serializer that leaks credential
// material in vulnerable mode (OWASP API3:2023 excessive data exposure).
const selfUser = (u: LabUser) =>
  isSecure()
    ? publicUser(u)
    : { ...publicUser(u), password: u.password, passwordHash: u.passwordHash, mfaSecret: u.mfaSecret, apiKey: u.apiKey };

const issueTokens = (u: LabUser, userAgent: string) => {
  const accessToken = signAccessToken({ sub: u.id, tid: u.tenantId, role: u.role, email: u.email });
  const refreshToken = `rt_${crypto.randomBytes(24).toString("hex")}`;
  refreshSessions.push({ token: refreshToken, userId: u.id, createdAt: Date.now(), userAgent });
  return { accessToken, refreshToken };
};

// ------------------------------- Register ------------------------------------
router.post("/auth/register", (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!email || !password || !name) {
    res.status(400).json({ error: "name, email and password are required." });
    return;
  }
  if (userByEmail(email)) {
    res.status(409).json({ error: "Account already exists." });
    return;
  }
  const nextId = Math.max(...users.map((u) => u.id)) + 1;

  let role: Role = "viewer";
  let tenantId: number;
  if (isSecure()) {
    // Tenant is derived from the verified email domain; role is always viewer.
    const domain = String(email).split("@")[1]?.toLowerCase() ?? "";
    const byDomain = [1, 2, 3].map((i) => tenantById(i)!).find((tt) => tt.ssoDomain === domain);
    tenantId = byDomain?.id ?? 1;
  } else {
    // INTENTIONAL-LAB-VULNERABILITY: mass assignment. Attacker-supplied `role`
    // and `tenantId` are accepted straight from the request body, allowing
    // self-elevation to admin/owner/superadmin or joining another tenant.
    // (OWASP API3:2023 Broken Object Property Level Authorization.)
    role = (req.body.role as Role) ?? "viewer";
    tenantId = Number(req.body.tenantId ?? 1);
  }

  const user: LabUser = {
    id: nextId, tenantId, name, email, role,
    password, passwordHash: hashPassword(password),
    mfaSecret: crypto.randomBytes(10).toString("hex"),
    apiKey: `tk_live_signup_${crypto.randomBytes(4).toString("hex")}`,
    status: "Active", initials: String(name).split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase(),
    lastActive: "Just now", createdAt: new Date().toISOString().slice(0, 10),
  };
  users.push(user);
  audit(user.id, "auth.register", `${email} role=${role} tenant=${tenantId}`);
  const tokens = issueTokens(user, req.header("user-agent") ?? "unknown");
  res.status(201).json({ user: selfUser(user), ...tokens, labMode: settings.labMode });
});

// -------------------------------- Login --------------------------------------
router.post("/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  const user = userByEmail(email);

  if (isSecure()) {
    // Generic error (no user enumeration); constant-ish work; verified hash.
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }
  } else {
    // INTENTIONAL-LAB-VULNERABILITY: username enumeration via distinct errors,
    // and no rate limiting / account lockout enables brute force
    // (OWASP API2:2023 / A07:2021). Also accepts the seeded plaintext directly.
    if (!user) {
      res.status(404).json({ error: "No account found for that email." });
      return;
    }
    const ok = password === user.password || verifyPassword(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Incorrect password for this account." });
      return;
    }
  }

  user.lastActive = "Just now";
  audit(user.id, "auth.login", `${email} via=password mode=${settings.labMode}`);
  const tokens = issueTokens(user, req.header("user-agent") ?? "unknown");
  // Cookie kept for browser flows; also returned for API clients.
  res.cookie?.("td_session", tokens.accessToken, { httpOnly: true, sameSite: "lax" });
  res.json({
    user: selfUser(user), organization: tenantById(user.tenantId),
    ...tokens, labMode: settings.labMode, debugEnabled: settings.debugEnabled,
    // In vulnerable mode we echo the signing secret hint to make the JWT-cracking
    // exercise self-contained; a real service would never do this.
    ...(isSecure() ? {} : { tokenType: "Bearer", secretHint: "HS256 signed with a weak shared secret" }),
  });
});

router.post("/auth/logout", (req, res) => {
  const rt = req.body?.refreshToken;
  if (rt) {
    const i = refreshSessions.findIndex((s) => s.token === rt);
    if (i >= 0) refreshSessions.splice(i, 1);
  }
  res.status(204).send();
});

// ------------------------------- Refresh -------------------------------------
router.post("/auth/refresh", (req, res) => {
  const rt = req.body?.refreshToken;
  const session = refreshSessions.find((s) => s.token === rt);
  if (!session) {
    res.status(401).json({ error: "Invalid refresh token." });
    return;
  }
  const user = userById(session.userId)!;
  // INTENTIONAL-LAB-VULNERABILITY: refresh tokens are not rotated in vulnerable
  // mode, so a stolen refresh token grants unlimited fresh access tokens.
  if (isSecure()) {
    const i = refreshSessions.indexOf(session);
    refreshSessions.splice(i, 1);
    const rotated = issueTokens(user, req.header("user-agent") ?? "unknown");
    res.json({ ...rotated });
    return;
  }
  res.json({ accessToken: signAccessToken({ sub: user.id, tid: user.tenantId, role: user.role, email: user.email }), refreshToken: rt });
});

// --------------------------------- Session -----------------------------------
router.get("/auth/session", (req, res) => {
  if (!req.auth) {
    res.status(401).json({ error: "Not authenticated." });
    return;
  }
  res.json({
    user: selfUser(req.auth.user),
    organization: tenantById(req.auth.tenantId),
    role: req.auth.role, tenantId: req.auth.tenantId, via: req.auth.via,
    labMode: settings.labMode, debugEnabled: settings.debugEnabled,
    ...(settings.debugEnabled ? { claims: req.auth.claims } : {}),
  });
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json(selfUser(req.auth!.user));
});

// ----------------------------- Password reset --------------------------------
router.post("/auth/forgot-password", (req, res) => {
  const { email } = req.body ?? {};
  const user = userByEmail(email);
  if (!user) {
    // Secure: same response regardless (no enumeration). Vulnerable: leaks.
    if (isSecure()) { res.json({ status: "If the account exists, a reset link was sent." }); return; }
    res.status(404).json({ error: "No account found for that email." });
    return;
  }
  const token = makeResetToken(user.id);
  resetTokens.push({ token, userId: user.id, email: user.email, expiresAt: Date.now() + 3600_000, used: false });
  audit(user.id, "auth.forgot", `reset requested for ${user.email}`);
  logger.info({ event: "reset", token, userId: user.id }, "[AUTH] reset token issued");
  if (isSecure()) {
    res.json({ status: "If the account exists, a reset link was sent." });
    return;
  }
  // INTENTIONAL-LAB-VULNERABILITY: the (predictable) reset token is returned in
  // the API response, and its format `rst-<userId>-<hourBucket>` is forgeable
  // for any user id. (OWASP A07:2021.)
  res.json({ status: "Reset token generated (lab returns it inline).", resetToken: token, resetUrl: `/reset?token=${token}` });
});

router.post("/auth/reset-password", (req, res) => {
  const { token, newPassword } = req.body ?? {};
  if (!token || !newPassword) {
    res.status(400).json({ error: "token and newPassword are required." });
    return;
  }
  if (isSecure()) {
    const entry = resetTokens.find((t) => t.token === token && !t.used && t.expiresAt > Date.now());
    if (!entry) { res.status(400).json({ error: "Invalid or expired reset token." }); return; }
    const user = userById(entry.userId)!;
    user.password = newPassword;
    user.passwordHash = hashPassword(newPassword);
    entry.used = true;
    res.json({ status: "Password updated." });
    return;
  }
  // INTENTIONAL-LAB-VULNERABILITY: the token is parsed for the target user id
  // (`rst-<id>-<bucket>`) and is neither bound to a session nor checked for
  // expiry/single-use. Forge `rst-7-<bucket>` to seize the platform-root
  // account — full account takeover. (OWASP A07:2021 / API2:2023.)
  const known = resetTokens.find((t) => t.token === token);
  const targetId = known?.userId ?? Number(/^rst-(\d+)-/.exec(String(token))?.[1]);
  const user = userById(targetId);
  if (!user) { res.status(400).json({ error: "Reset token does not map to a user." }); return; }
  user.password = newPassword;
  user.passwordHash = hashPassword(newPassword);
  audit(user.id, "auth.reset", `password reset for ${user.email} via forgeable token`);
  res.json({ status: "Password updated.", user: publicUser(user) });
});

export default router;
