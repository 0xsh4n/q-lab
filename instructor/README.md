# TechDesk AI — instructor materials

These guides are intentionally separate from the student surface. Run `LAB_MODE=vulnerable` for the first pass and `LAB_MODE=secure` for remediation. Set `DEBUG_LAB=true` only while demonstrating model context, retrieval, tool calls, and JWT claims to the class.

The authoritative, machine-readable list of every intentional weakness is `GET /api/lab/vulnerabilities` and the in-app **Security Lab** page. The project `README.md` carries a copy-paste reproduction for each. Use the scenario files below for lecture pairing and debrief structure.

## Scenario files

| File | Focus |
| --- | --- |
| `01-recon.md` | Reconnaissance and API mapping (incl. `v1`/`internal` inventory) |
| `02-idor.md` | BOLA / IDOR across tenants |
| `03-prompt-injection.md` | Direct prompt injection |
| `04-rag.md` | Cross-tenant RAG / vector retrieval |
| `05-indirect-injection.md` | Indirect injection / RAG poisoning |
| `06-agent.md` | Excessive agency |
| `07-tools.md` | Tool parameter manipulation |
| `08-ssrf.md` | SSRF via webhooks / import / agent tools |
| `09-output-handling.md` | Improper output handling → XSS |
| `10-mcp.md` | MCP trust boundary |
| `11-chaining.md` | Vulnerability chaining |
| `12-reporting.md` | Evidence and reporting |

## Catalog → debrief map

Group the debrief by the four domains and always end each with the secure-mode comparison.

**Authentication.** JWT `alg:none`/decode-without-verify (`auth-jwt-alg-none`), weak HS256 secret and its leak (`auth-jwt-weak-secret`, `api-misconfig`), registration mass assignment (`auth-mass-assignment`), forgeable reset-token account takeover (`auth-reset-forgery`), user enumeration + no lockout (`auth-user-enum`), and the CVE-2025-29927-class middleware bypass (`auth-middleware-bypass`). Teaching point: authentication proves identity; authorization must derive from verified server-side state, never from client-supplied tokens/headers.

**LLM / AI.** Direct injection + system-prompt leak, indirect injection / RAG poisoning, sensitive disclosure, excessive agency, cross-tenant vector recall, prompt-to-SQL (CVE-2024-5565-class), guardrail bypass, unbounded consumption, supply chain. Teaching point: treat retrieved/user content as untrusted data and model output as untrusted for rendering and for any downstream action; the model is never the authorization boundary.

**API.** BOLA, BFLA admin, excessive data exposure, improper inventory (`v1`), SSRF, unrestricted consumption / business flows, security misconfiguration. Teaching point: enforce object- and function-level authorization server-side on every route, including deprecated ones.

**Web.** SQL injection (simulated), stored/reflected XSS via LLM output, path traversal, open redirect, CORS misconfiguration + missing headers. Teaching point: validate/parameterize all inputs, encode all outputs, and treat model output as an untrusted source.

## Debrief structure (per finding)

Objective → prerequisites → target functionality → discovery path → evidence → impact → remediation → secure-mode result → OWASP/CVE mapping.
