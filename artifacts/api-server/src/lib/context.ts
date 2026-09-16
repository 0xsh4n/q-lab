// -----------------------------------------------------------------------------
// TechDesk AI — request authentication context & authorization middleware
// -----------------------------------------------------------------------------
import type { NextFunction, Request, Response } from "express";
import { isSecure, userById, users, type LabUser, type Role } from "./store";
import { verifyToken, type JwtClaims } from "./security";

export interface AuthContext {
  user: LabUser;
  role: string;
  tenantId: number;
  via: "jwt" | "legacy-header" | "middleware-bypass" | "api-key";
  bypass?: boolean;
  claims?: JwtClaims;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

const bearer = (req: Request): string | null => {
  const h = req.header("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
};

/**
 * Resolve the caller's identity onto req.auth. This runs on every /api request.
 * It is deliberately permissive in vulnerable mode:
 *  - trusts forged JWT role/tenant claims (privilege & tenant escalation)
 *  - accepts the legacy x-lab-user header (no proof of identity)
 *  - honours the Next.js-style x-middleware-subrequest bypass header
 * Secure mode ignores all of that and trusts only a verified token/API key.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  // INTENTIONAL-LAB-VULNERABILITY: CVE-2025-29927-style middleware auth bypass.
  // Sending `x-middleware-subrequest: middleware` (a value used by the real
  // Next.js flaw) short-circuits authentication and grants platform-admin.
  const subrequest = req.header("x-middleware-subrequest");
  if (!isSecure() && subrequest && subrequest.includes("middleware")) {
    const root = userById(7)!;
    req.auth = { user: root, role: "superadmin", tenantId: root.tenantId, via: "middleware-bypass", bypass: true };
    return next();
  }

  // API key auth (x-api-key). Keys are guessable/loggable synthetic values.
  const apiKey = req.header("x-api-key");
  if (apiKey) {
    const owner = users.find((u) => u.apiKey === apiKey);
    if (owner) {
      req.auth = { user: owner, role: owner.role, tenantId: owner.tenantId, via: "api-key" };
      return next();
    }
  }

  const token = bearer(req);
  if (token) {
    const result = verifyToken(token);
    if (result.ok && result.claims) {
      const claimed = result.claims;
      const user = userById(Number(claimed.sub)) ?? userById(1)!;
      if (isSecure()) {
        // Authorization derives ONLY from the verified server-side record.
        req.auth = { user, role: user.role, tenantId: user.tenantId, via: "jwt", claims: claimed };
      } else {
        // INTENTIONAL-LAB-VULNERABILITY: trust client-controlled role/tenant
        // claims. Forge `role:"superadmin"` or a different `tid` to escalate
        // privileges or cross tenants. (OWASP API1/API2/API5:2023.)
        req.auth = {
          user,
          role: String(claimed.role ?? user.role),
          tenantId: Number(claimed.tid ?? user.tenantId),
          via: "jwt",
          claims: claimed,
        };
      }
      return next();
    }
  }

  // Legacy convenience header used by the reproduction curl commands.
  const legacy = Number(req.header("x-lab-user"));
  if (legacy) {
    const user = userById(legacy);
    if (user && !isSecure()) {
      req.auth = { user, role: user.role, tenantId: user.tenantId, via: "legacy-header" };
      return next();
    }
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required.", code: "unauthenticated" });
    return;
  }
  next();
}

const RANK: Record<string, number> = { viewer: 1, agent: 2, admin: 3, owner: 4, superadmin: 5 };

/**
 * Function-level authorization guard. In vulnerable mode this is intentionally
 * a no-op for the effective role (which may itself be a forged claim), so any
 * authenticated caller can reach admin functions (OWASP API5:2023 BFLA).
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    if (isSecure()) {
      const need = Math.min(...roles.map((r) => RANK[r] ?? 99));
      if ((RANK[req.auth.role] ?? 0) < need) {
        res.status(403).json({ error: "Insufficient role.", need: roles, have: req.auth.role });
        return;
      }
    }
    next();
  };
}

/** Tenant to scope data to. Uses the effective (possibly forged) tenant. */
export const scopeTenantId = (req: Request): number => req.auth?.tenantId ?? 1;
export const effectiveRole = (req: Request): string => req.auth?.role ?? "viewer";
