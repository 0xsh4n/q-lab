# Q-Lab: AI Pentest Operations

Q-Lab is a Bond-inspired, unofficial local AI customer-support SaaS used to teach deterministic application and AI security testing. It was created by Ajmal Shan (0xsh4n).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Docker lab: `./scripts/setup.sh`, `./scripts/status.sh`, `./scripts/reset.sh`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/acme-desk` — React/Vite Q-Lab dashboard and route-level UI
- `artifacts/api-server/src/routes/acmedesk.ts` — deterministic Q-Lab API, seeded synthetic data, and vulnerable/secure switches
- `lib/api-spec/openapi.yaml` — API contract source of truth
- `student/` — student methodology, rules, checklist, and report template
- `instructor/` — 12 guided scenario guides with remediation and OWASP mappings
- `docker-compose.yml` — full local topology including Postgres, Qdrant, Ollama, internal service, MCP simulator, Nginx

## Architecture decisions

- The Replit preview uses the same typed REST contract as the Docker lab, but uses deterministic in-memory fixtures so the course starts without a paid AI key or a database setup step.
- `LAB_MODE=vulnerable` is the default for teaching; secure mode applies tenant and agent authorization checks so instructors can demonstrate remediation.
- Internal fetch and MCP examples are Docker-only and synthetic; public destinations and host access are intentionally unavailable.
- The frontend consumes generated API hooks from the OpenAPI spec rather than hand-written client contracts.

## Product

The app provides a realistic support workspace with dashboard metrics, knowledge documents, search, assistant chat, agent workflows, support tickets, organization members, settings, health status, and lab diagnostics. The UI does not disclose vulnerability names.

## User preferences

No additional project-specific preferences recorded.

## Gotchas

- Run OpenAPI codegen after changing `lib/api-spec/openapi.yaml`.
- Keep the lab bound to local/synthetic targets; never add real credentials or public SSRF destinations.
- The Docker Compose setup expects the repository root as its build context because this is a pnpm monorepo.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
