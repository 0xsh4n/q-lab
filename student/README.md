# TechDesk AI — student guide

You are testing **TechDesk AI**, a multi-tenant, AI-powered customer-support SaaS, as if you were handed a normal product URL and asked to assess it. Start at `http://localhost:8080`, build a small attack-surface map, and keep evidence for every observation.

TechDesk AI is an intentionally vulnerable training lab. All data is synthetic. Do not use real credentials and do not point any feature at real systems.

## Lab-only accounts (password `Password123!` unless noted)

| Email | Tenant | Role |
| --- | --- | --- |
| `alice@northwind.example` | Northwind Trading | admin |
| `bob@northwind.example` | Northwind Trading | agent |
| `carol@meridian.example` | Meridian Health | admin |
| `erin@vertex.example` | Vertex Logistics | owner |
| `root@techdesk.ai` | platform | superadmin (password `admin`) |

## How to authenticate

The API uses JWT bearer tokens. Sign in through the UI, or from the CLI:

```bash
export BASE_URL=http://localhost:8080
TOKEN=$(curl -sS -X POST "$BASE_URL/api/auth/login" -H 'content-type: application/json' \
  -d '{"email":"alice@northwind.example","password":"Password123!"}' | jq -r .accessToken)
curl -sS "$BASE_URL/api/auth/session" -H "authorization: Bearer $TOKEN" | jq
```

## Suggested order

1. Recon and API mapping (`/api/healthz`, browser network tab, look for versioned/`internal` routes).
2. Authentication testing (token handling, registration, password reset, brute force).
3. Tenant and object boundaries (change an id; compare responses).
4. AI assistant behavior (prompt injection, output handling).
5. RAG / search / embeddings (cross-tenant retrieval).
6. Agent tools (excessive agency, SSRF).
7. API/web classics (SQLi, path traversal, open redirect, CORS).
8. Chain findings into real impact.

The app narrates exercises only on the **Security Lab** page and in the project `README.md` / `instructor/` material — form a hypothesis from testing first, then confirm. See `student/methodology.md`, `student/lab-rules.md`, `student/checklist.md`, and `student/report-template.md`.
