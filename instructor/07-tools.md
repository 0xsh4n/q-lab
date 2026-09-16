# Scenario 07 — Tool parameter manipulation

**Objective:** Test whether changing a tool parameter crosses the tenant boundary or reaches a high-impact action.

**Prerequisites:** Inspect `GET /api/agent/tools` and `POST /api/agent/run`.

**Target functionality:** `requestedTool`, document ids, user ids, and email recipients passed to the agent.

**Expected discovery path:** Keep the action constant and alter only the identifier (e.g. a Meridian document id such as `201`), or request a high-risk tool (`send_email`, `update_profile`, `http_get`).

**Evidence:** Parameter diff, selected tool, returned observation, status.

**Expected impact:** An otherwise harmless tool becomes an object-access or side-effect primitive; the model becomes the authorization boundary.

**Remediation:** Resolve the current principal on the backend and scope every identifier; enforce per-tool authorization independent of model intent.

**Instructor solution:** Vulnerable mode executes cross-tenant/high-risk tool calls and returns an observation; secure mode blocks before the tool runs.

**OWASP mapping:** LLM06:2025 Excessive Agency / API1:2023.
