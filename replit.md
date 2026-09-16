# TechDesk AI — Vulnerable Multi-Tenant AI SaaS (Pentest Lab)

TechDesk AI is a realistic, intentionally vulnerable, multi-tenant AI customer-support SaaS used to teach application, API, and AI/LLM security testing with deterministic synthetic data.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/techdesk run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Docker lab: `./scripts/setup.sh`, `./scripts/status.sh`, `./scripts/reset.sh`
- Key env: `LAB_MODE` (vulnerable|secure), `DEBUG_LAB`, `JWT_SECRET`, `OLLAMA_MODEL`

## Stack

- pnpm workspaces, Node.js 22/24, TypeScript 5.9
- API: Express 5, JWT + password primitives implemented with `node:crypto` (no external JWT/bcrypt dep)
- Build: esbuild (ESM bundle)
- Frontend: React 19 + Vite 7 + Tailwind, TanStack Query, wouter
- Frontend API access: hand-written typed client (`artifacts/techdesk/src/lib/api.ts`), bearer-token auth

## Where things live

- `artifacts/techdesk` — React/Vite TechDesk AI dashboard and route-level UI (incl. Security Lab page)
- `artifacts/api-server/src/lib/store.ts` — multi-tenant synthetic data (tenants, users, documents, tickets)
- `artifacts/api-server/src/lib/security.ts` — JWT + password hashing with intentional, mode-gated weaknesses
- `artifacts/api-server/src/lib/context.ts` — authentication middleware + authorization guards
- `artifacts/api-server/src/routes/` — `auth`, `techdesk` (core SaaS), `ai` (LLM), `apisec` (API/web), `lab` (catalog), `health`
- `student/` — student methodology, rules, checklist, report template
- `instructor/` — scenario guides with remediation and OWASP mappings
- `docker-compose.yml` — full local topology (Postgres, Qdrant, Ollama, internal service, MCP simulator, Nginx)

## Architecture decisions

- The Replit preview uses deterministic in-memory fixtures so the course starts without a paid AI key or DB step.
- `LAB_MODE=vulnerable` is the default; `secure` applies auth, tenant, and agent authorization checks for a clean remediated comparison. Mode can be flipped at runtime via `PATCH /api/settings` or the Security Lab page.
- Every intentional weakness is marked `INTENTIONAL-LAB-VULNERABILITY` and gated by lab mode.
- Internal fetch, SSRF, and MCP examples are Docker-only and synthetic.
- The generated `lib/api-*` packages and `lib/api-spec/openapi.yaml` remain as reference artifacts; the running app uses the hand-written client.

## Product

A realistic support workspace: dashboard, knowledge documents, semantic search, AI assistant, agent runner, tickets, members, settings, health status, and a Security Lab catalog page. Beyond the Security Lab page, the UI does not narrate exploit steps.

## Gotchas

- Keep the lab bound to local/synthetic targets; never add real credentials or public SSRF destinations.
- Docker Compose expects the repository root as build context (pnpm monorepo).
- `pnpm` is provided via `corepack`.
