# Scenario 08 — AI to bounded SSRF

**Objective:** Determine whether URL fetching can reach an internal service without becoming an internet pivot.

**Prerequisites:** Use `/api/tools/fetch-url` (bounded demo), or the real fetch surfaces `POST /api/webhooks/test`, `POST /api/documents/import`, and the agent `http_get` tool.

**Target functionality:** Server-side URL fetching and the Docker-only `internal-service` (metadata relay at `/metadata`, internal admin panel at `/admin`).

**Expected discovery path:** Point a fetch at `http://internal-service:8081/admin` or `/metadata` to reach an internal-only surface; then confirm secure mode blocks internal/metadata destinations.

**Evidence:** Both requests and response bodies.

**Expected impact:** Internal metadata exposure within the isolated lab only.

**Remediation:** Use an allowlist, resolve and validate destinations, disable redirects, and keep internal services on private networks.

**Instructor solution:** Only `internal-service` is accepted; arbitrary public hosts are rejected.

**OWASP mapping:** API7:2023 Server Side Request Forgery.

**Suggested Udemy lecture:** SSRF controls and cloud metadata risks.