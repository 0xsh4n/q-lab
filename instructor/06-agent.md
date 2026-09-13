# Scenario 06 — Agent tool abuse

**Objective:** Trace a user request through agent planning, tool selection, and backend observation.

**Prerequisites:** Open Agent and inspect the available tools.

**Target functionality:** `GET /api/agent/tools` and `POST /api/agent/run`.

**Expected discovery path:** Request a normal directory or knowledge action, then ask for a resource outside the organization.

**Evidence:** Tool list, steps, tools used, observation, status.

**Expected impact:** The model becomes an authorization boundary.

**Remediation:** Enforce authorization in each tool handler independent of model intent.

**Instructor solution:** Vulnerable mode accepts a cross-tenant instruction and returns a synthetic observation; secure mode stops before the tool call.

**OWASP mapping:** LLM06:2025 Excessive Agency.

**Suggested Udemy lecture:** Tool-using agents and backend authorization.