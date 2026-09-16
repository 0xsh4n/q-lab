// -----------------------------------------------------------------------------
// TechDesk AI — authentication primitives (JWT + password hashing)
// -----------------------------------------------------------------------------
// Implemented with node:crypto only (no external JWT/bcrypt dependency) so the
// lab can craft precise, well-known token-handling weaknesses. All weaknesses
// are gated by lab mode and marked INTENTIONAL-LAB-VULNERABILITY.
// -----------------------------------------------------------------------------

import crypto from "node:crypto";
import { isSecure, settings, users } from "./store";

export interface JwtHeader {
  alg: string;
  typ?: string;
  kid?: string;
}

export interface JwtClaims {
  sub: number; // user id
  tid: number; // tenant id
  role: string;
  email: string;
  iss?: string;
  iat?: number;
  exp?: number;
  [k: string]: unknown;
}

export interface VerifyResult {
  ok: boolean;
  claims?: JwtClaims;
  header?: JwtHeader;
  reason?: string;
}

const ISSUER = "techdesk-ai";
const b64url = (input: Buffer | string): string =>
  Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlJson = (obj: unknown): string => b64url(JSON.stringify(obj));
const fromB64url = (s: string): Buffer => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

const hmacSha256 = (data: string, secret: string): string =>
  b64url(crypto.createHmac("sha256", secret).update(data).digest());

/**
 * Sign a standard HS256 access token. The signing secret is a weak, shared,
 * developer-style secret (see store.settings.jwtSecret) — deliberately
 * brute-forceable to teach JWT secret cracking (jwt_tool / hashcat 16500).
 */
export function signAccessToken(claims: JwtClaims, ttlSeconds = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const payload: JwtClaims = { iss: ISSUER, iat: now, exp: now + ttlSeconds, ...claims };
  const signingInput = `${b64urlJson(header)}.${b64urlJson(payload)}`;
  return `${signingInput}.${hmacSha256(signingInput, settings.jwtSecret)}`;
}

export function decodeToken(token: string): { header?: JwtHeader; claims?: JwtClaims } {
  const parts = token.split(".");
  if (parts.length < 2) return {};
  try {
    return {
      header: JSON.parse(fromB64url(parts[0]).toString("utf8")),
      claims: JSON.parse(fromB64url(parts[1]).toString("utf8")),
    };
  } catch {
    return {};
  }
}

/**
 * Verify a JWT. Secure mode enforces HS256, a valid signature over the weak
 * secret, the issuer, and expiry. Vulnerable mode intentionally accepts several
 * broken conditions used across CTFs and real incidents.
 */
export function verifyToken(token: string): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [h, p, sig] = parts;
  const { header, claims } = decodeToken(token);
  if (!header || !claims) return { ok: false, reason: "undecodable" };

  if (isSecure()) {
    // Secure: pinned algorithm, verified signature, issuer, and expiry.
    if (header.alg !== "HS256") return { ok: false, reason: "unexpected-alg" };
    const expected = hmacSha256(`${h}.${p}`, settings.jwtSecret);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, reason: "bad-signature" };
    if (claims.iss !== ISSUER) return { ok: false, reason: "bad-issuer" };
    if (typeof claims.exp !== "number" || claims.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false, reason: "expired" };
    }
    return { ok: true, claims, header };
  }

  // INTENTIONAL-LAB-VULNERABILITY: algorithm confusion / "alg:none" acceptance.
  // A token with {"alg":"none"} and an empty signature is trusted, letting an
  // attacker forge arbitrary sub/tid/role claims. (OWASP API2:2023 Broken
  // Authentication; classic CVE-2015-9235-class JWT flaw, still common today.)
  if (header.alg === "none" || header.alg === "None" || header.alg === "NONE") {
    return { ok: true, claims, header };
  }

  // INTENTIONAL-LAB-VULNERABILITY: signature is accepted if present but is NOT
  // actually re-computed in vulnerable mode. Expiry is ignored. This models
  // apps that decode-but-do-not-verify and never check `exp`.
  return { ok: true, claims, header };
}

// --------------------------- Password hashing --------------------------------

/**
 * INTENTIONAL-LAB-VULNERABILITY (vulnerable mode): fast, unsalted SHA-256.
 * Trivially crackable with rainbow tables / hashcat. Secure mode uses salted
 * scrypt. (OWASP A02:2021 Cryptographic Failures.)
 */
export function hashPassword(password: string, salt?: string): string {
  if (isSecure()) {
    const s = salt ?? crypto.randomBytes(16).toString("hex");
    const derived = crypto.scryptSync(password, s, 32).toString("hex");
    return `scrypt$${s}$${derived}`;
  }
  return `sha256$${crypto.createHash("sha256").update(password).digest("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith("scrypt$")) {
    const [, s, derived] = stored.split("$");
    const check = crypto.scryptSync(password, s, 32).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(check), Buffer.from(derived));
  }
  const check = crypto.createHash("sha256").update(password).digest("hex");
  return `sha256$${check}` === stored;
}

// Precompute the weak seed hashes for the store's users.
for (const u of users) if (!u.passwordHash) u.passwordHash = `sha256$${crypto.createHash("sha256").update(u.password).digest("hex")}`;

/**
 * Predictable password-reset token. In vulnerable mode it is derived only from
 * the user id + a coarse time bucket, so it is guessable/forgeable and not
 * bound to a verified session. Secure mode issues a 32-byte random token.
 * (OWASP A07:2021 Identification & Authentication Failures.)
 */
export function makeResetToken(userId: number): string {
  if (isSecure()) return crypto.randomBytes(32).toString("hex");
  const bucket = Math.floor(Date.now() / 1000 / 3600); // hourly bucket
  return `rst-${userId}-${bucket}`;
}

export { ISSUER };
