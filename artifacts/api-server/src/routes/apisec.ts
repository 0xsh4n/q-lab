// -----------------------------------------------------------------------------
// TechDesk AI — API-security & web-security surface
// -----------------------------------------------------------------------------
// Covers OWASP API Top 10 (2023) items beyond BOLA plus classic web flaws:
// improper inventory (v1 legacy), injection (simulated SQLi), BFLA (admin),
// path traversal, open redirect, SSRF (webhooks), unrestricted business flows,
// security misconfiguration, and a few recent CVE-class behaviours (emulated).
// -----------------------------------------------------------------------------
import { Router, type IRouter } from "express";
import {
  audit, auditLog, isSecure, refreshSessions, settings, tenantById, tenants, users,
} from "../lib/store";
import { signAccessToken } from "../lib/security";
import { requireAuth, requireRole } from "../lib/context";

const router: IRouter = Router();

// ============================================================================
// OWASP API9:2023 — Improper Inventory Management
// A deprecated, less-guarded v1 API kept alive next to the current one.
// ============================================================================

// INTENTIONAL-LAB-VULNERABILITY: simulated SQL injection. The "query" is treated
// as if concatenated into `SELECT ... WHERE name LIKE '%<q>%'`. Classic
// tautology and UNION payloads change the returned rows. (OWASP A03:2021.)
router.get("/v1/search", (req, res) => {
  const q = String(req.query.q ?? "");
  if (isSecure()) {
    const tenant = Number(req.query.tenantId ?? 1);
    res.json({ engine: "parameterized", rows: users.filter((u) => u.tenantId === tenant && u.name.toLowerCase().includes(q.toLowerCase())).map((u) => ({ id: u.id, name: u.name })) });
    return;
  }
  const lowered = q.toLowerCase();
  // Verbose, injectable-looking error for a lone quote (error-based SQLi + info
  // disclosure via stack/DB error).
  if ((q.match(/'/g)?.length ?? 0) % 2 === 1 && !lowered.includes("or") && !lowered.includes("union")) {
    res.status(500).json({
      error: "SQLSTATE[42000]: syntax error at or near \"'\"",
      query: `SELECT id,name,email,password_hash FROM users WHERE name LIKE '%${q}%'`,
      hint: "unterminated quoted string",
    });
    return;
  }
  const tautology = /('|\s)or\s+('?1'?\s*=\s*'?1|1=1)/i.test(q) || lowered.includes("' or '1'='1");
  const union = lowered.includes("union") && lowered.includes("select");
  if (tautology || union) {
    // Exfiltrate every row across every tenant, including password hashes.
    res.json({
      engine: "string-concatenation",
      query: `SELECT id,name,email,password_hash FROM users WHERE name LIKE '%${q}%'`,
      rows: users.map((u) => ({ id: u.id, tenantId: u.tenantId, name: u.name, email: u.email, password_hash: u.passwordHash, api_key: u.apiKey })),
    });
    return;
  }
  res.json({ engine: "string-concatenation", query: `SELECT id,name,email FROM users WHERE name LIKE '%${q}%'`, rows: users.filter((u) => u.name.toLowerCase().includes(lowered)).map((u) => ({ id: u.id, name: u.name, email: u.email })) });
});

// v1 profile without tenant scoping (legacy BOLA).
router.get("/v1/users/:id", (req, res) => {
  const u = users.find((x) => x.id === Number(req.params.id));
  if (!u) { res.status(404).json({ error: "not found" }); return; }
  res.json(isSecure() ? { id: u.id, name: u.name } : { ...u });
});

// ============================================================================
// OWASP API5:2023 — Broken Function Level Authorization (admin surface)
// ============================================================================
// requireRole enforces the role ONLY in secure mode; in vulnerable mode it is a
// no-op, so any authenticated caller reaches these admin functions (BFLA).
router.get("/admin/users", requireAuth, requireRole("superadmin"), (_req, res) => {
  // Full cross-tenant dump incl. secrets. Reachable by any authenticated caller
  // in vulnerable mode (no admin check).
  res.json(users.map((u) => ({ id: u.id, tenantId: u.tenantId, name: u.name, email: u.email, role: u.role, password: u.password, passwordHash: u.passwordHash, mfaSecret: u.mfaSecret, apiKey: u.apiKey })));
});

router.get("/admin/audit", requireAuth, requireRole("superadmin"), (_req, res) => res.json(auditLog));

// INTENTIONAL-LAB-VULNERABILITY: impersonation with no privileged check in
// vulnerable mode — mint a token for any user id (account takeover / BFLA).
router.post("/admin/impersonate", requireAuth, (req, res) => {
  const id = Number(req.body?.userId);
  const target = users.find((u) => u.id === id);
  if (!target) { res.status(404).json({ error: "user not found" }); return; }
  if (isSecure() && req.auth!.role !== "superadmin") { res.status(403).json({ error: "superadmin required" }); return; }
  audit(req.auth!.user.id, "admin.impersonate", `minted token for user ${id}`);
  res.json({ accessToken: signAccessToken({ sub: target.id, tid: target.tenantId, role: target.role, email: target.email }), impersonating: { id: target.id, email: target.email, role: target.role } });
});

// ============================================================================
// OWASP API8:2023 / A05:2021 — Security Misconfiguration (internal inventory)
// ============================================================================
// INTENTIONAL-LAB-VULNERABILITY: internal config/secrets endpoint with no auth
// in vulnerable mode. Leaks the JWT signing secret → offline token forgery.
router.get("/internal/config", (_req, res) => {
  if (isSecure()) { res.status(404).json({ error: "not found" }); return; }
  res.json({
    service: "techdesk-api", labMode: settings.labMode, model: settings.model,
    jwtSecret: settings.jwtSecret, jwtAlg: "HS256",
    database: "postgres://techdesk:techdesk-lab-only@postgres:5432/techdesk",
    internalServices: { relay: "http://internal-service:8081", mcp: "http://mcp-server:8090" },
    env: { NODE_ENV: process.env.NODE_ENV ?? "production", OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL },
  });
});

router.get("/openapi.json", (_req, res) => res.json({ openapi: "3.1.0", info: { title: "TechDesk AI API", version: "2.0.0" }, note: "Full inventory exposed unauthenticated (API9:2023).", paths: { "/api/v1/search": {}, "/api/admin/users": {}, "/api/internal/config": {}, "/api/files": {}, "/api/redirect": {} } }));

// ============================================================================
// Path traversal — A01/A05 (attachment/file read)
// ============================================================================
const SYNTH_FILES: Record<string, string> = {
  "welcome.txt": "Welcome to TechDesk AI.",
  "logo.svg": "<svg/>",
  "../../etc/passwd": "root:x:0:0:root:/root:/bin/bash\ntechdesk:x:1000:1000::/home/techdesk:/bin/sh",
  "../.env": "JWT_SECRET=techdesk-dev-secret\nPOSTGRES_PASSWORD=qlab-lab-only",
};
router.get("/files", (req, res) => {
  const name = String(req.query.name ?? "");
  if (isSecure()) {
    if (name.includes("..") || name.includes("/")) { res.status(400).json({ error: "Invalid file name." }); return; }
    const body = SYNTH_FILES[name];
    if (!body) { res.status(404).json({ error: "not found" }); return; }
    res.type("text/plain").send(body);
    return;
  }
  // INTENTIONAL-LAB-VULNERABILITY: no normalization — `../` escapes the intended
  // directory and reads synthetic sensitive files.
  const body = SYNTH_FILES[name] ?? (name.includes("passwd") ? SYNTH_FILES["../../etc/passwd"] : name.includes(".env") ? SYNTH_FILES["../.env"] : undefined);
  if (body === undefined) { res.status(404).json({ error: "not found", resolved: `/var/techdesk/uploads/${name}` }); return; }
  res.type("text/plain").send(body);
});

// ============================================================================
// Open redirect — CWE-601 / A01
// ============================================================================
router.get("/redirect", (req, res) => {
  const url = String(req.query.url ?? "/");
  if (isSecure()) {
    if (!url.startsWith("/") || url.startsWith("//")) { res.status(400).json({ error: "Only same-site relative redirects are allowed." }); return; }
    res.redirect(url);
    return;
  }
  // INTENTIONAL-LAB-VULNERABILITY: unvalidated redirect target (phishing pivot).
  res.redirect(url);
});

// ============================================================================
// SSRF via webhook test — API7:2023 / A10:2021
// ============================================================================
router.post("/webhooks/test", requireAuth, async (req, res) => {
  const url = String(req.body?.url ?? "");
  if (isSecure()) {
    if (!/^https:\/\//.test(url) || /internal-service|localhost|127\.|169\.254|metadata|10\.|192\.168/.test(url)) {
      res.status(400).json({ error: "Destination not allowed." });
      return;
    }
  }
  try {
    const resp = await fetch(url, { method: "POST", body: JSON.stringify({ ping: "techdesk" }), signal: AbortSignal.timeout?.(2500) });
    const body = (await resp.text()).slice(0, 1500);
    res.json({ url, status: resp.status, body });
  } catch (e) {
    res.status(502).json({ error: "delivery failed", detail: String((e as Error).message), url });
  }
});

// ============================================================================
// OWASP API4/API6:2023 — Unrestricted consumption & sensitive business flows
// ============================================================================
router.post("/export", requireAuth, (req, res) => {
  const limit = Number(req.body?.limit ?? 100000);
  if (isSecure() && limit > 1000) { res.status(429).json({ error: "Export size exceeds the allowed limit." }); return; }
  // No pagination/rate limit; returns everything the (possibly forged) tenant
  // scope allows — bulk exfiltration of a sensitive business flow.
  const tid = req.auth!.tenantId;
  const rows = (isSecure() ? users.filter((u) => u.tenantId === tid) : users).slice(0, limit);
  res.json({ exportedAt: new Date().toISOString(), count: rows.length, rows: rows.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, tenantId: u.tenantId })) });
});

router.post("/invitations/bulk", requireAuth, (req, res) => {
  const emails: string[] = Array.isArray(req.body?.emails) ? req.body.emails : [];
  if (isSecure() && emails.length > 25) { res.status(429).json({ error: "Too many invitations in one request." }); return; }
  // INTENTIONAL-LAB-VULNERABILITY: no throttling — abusable for mass email /
  // resource exhaustion (API4/API6:2023).
  res.json({ requested: emails.length, sent: emails.length, note: "No rate limit applied." });
});

// ============================================================================
// Recent CVE-class behaviour (EMULATED for training; not a vulnerable dependency)
// ============================================================================
// Emulates CVE-2024-37032 ("Probllama") — Ollama path traversal when pulling a
// model manifest with a crafted digest/path. Here `path` traverses to synthetic
// files, standing in for the arbitrary file read/write of the real CVE.
router.get("/v1/models/pull", (req, res) => {
  const path = String(req.query.path ?? "library/phi3");
  if (isSecure()) { res.json({ model: path.replace(/[^a-z0-9/_.:-]/gi, ""), status: "pulled" }); return; }
  if (path.includes("..")) {
    res.json({ cve: "CVE-2024-37032 (emulated)", requestedPath: path, read: SYNTH_FILES["../.env"], note: "Traversal in the model path yielded a file outside the model store." });
    return;
  }
  res.json({ model: path, status: "pulled" });
});

// Emulates CVE-2025-29927 acknowledgement surface: report whether the bypass
// header is currently honoured (informational for the exercise).
router.get("/internal/middleware-status", (req, res) => {
  res.json({ cve: "CVE-2025-29927 (emulated)", header: "x-middleware-subrequest", honoured: !isSecure(), sent: Boolean(req.header("x-middleware-subrequest")) });
});

// Deprecated session dump (API9) — reveals active refresh tokens in vuln mode.
router.get("/v1/sessions", (_req, res) => {
  if (isSecure()) { res.status(404).json({ error: "not found" }); return; }
  res.json({ activeRefreshTokens: refreshSessions.map((s) => ({ token: s.token, userId: s.userId })), tenants: tenants.map((t) => t.slug) });
});

export default router;
