# Scenario 08 — AI to bounded SSRF

**Objective:** Determine whether URL fetching can reach an internal service without becoming an internet pivot.

**Prerequisites:** Use the agent/tool surface or send a direct request to `/api/tools/fetch-url`.

**Target functionality:** URL fetch simulation and the Docker-only internal service.

**Expected discovery path:** Test the synthetic internal hostname, then test a public destination and confirm it is rejected.

**Evidence:** Both requests and response bodies.

**Expected impact:** Internal metadata exposure within the isolated lab only.

**Remediation:** Use an allowlist, resolve and validate destinations, disable redirects, and keep internal services on private networks.

**Instructor solution:** Only `internal-service` is accepted; arbitrary public hosts are rejected.

**OWASP mapping:** API7:2023 Server Side Request Forgery.

**Suggested Udemy lecture:** SSRF controls and cloud metadata risks.