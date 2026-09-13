# Scenario 10 — MCP security

**Objective:** Inspect how an agent discovers and trusts internal MCP tools.

**Prerequisites:** Start Docker Compose and inspect the MCP server on the internal network.

**Target functionality:** `/tools`, simulated JSON-RPC response, and the agent's tool inventory.

**Expected discovery path:** Compare tool descriptions with backend authorization and ask who owns the final check.

**Evidence:** Tool manifest, request/response, authorization decision.

**Expected impact:** A trusted tool description can widen the agent's effective capability.

**Remediation:** Authenticate tool calls, scope tool data, and apply backend policy after MCP invocation.

**Instructor solution:** MCP is an advanced, internal-only fixture; it never reaches public systems.

**OWASP mapping:** LLM08:2025 Vector and Embedding Weaknesses / Excessive Agency.

**Suggested Udemy lecture:** MCP trust boundaries and tool authorization.