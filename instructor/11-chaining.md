# Scenario 11 — Multi-step workflow chain

**Objective:** Combine individually low-impact observations into a meaningful workflow.

**Prerequisites:** Complete the search, chat, and agent scenarios.

**Target functionality:** Search → retrieve → agent tool → ticket workflow.

**Expected discovery path:** Use a retrieved identifier as an agent parameter and observe the resulting support action.

**Evidence:** Each request, identifier, returned observation, and ticket record.

**Expected impact:** Context disclosure becomes an unauthorized support action.

**Remediation:** Use an authorization decision at every state transition, not only at the first request.

**Instructor solution:** Vulnerable mode intentionally trusts the agent's requested resource; secure mode stops the chain.

**OWASP mapping:** LLM06:2025 Excessive Agency.

**Suggested Udemy lecture:** Vulnerability chaining and impact validation.