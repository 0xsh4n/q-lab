# Scenario 01 — Reconnaissance and API mapping

**Objective:** Build a route, identity, data, and trust-boundary map before exploiting anything.

**Prerequisites:** Start the lab and sign in as `alice@acme.local`.

**Target functionality:** Navigation, browser network requests, `/api/healthz`, `/api/auth/session`, and the visible workspace pages.

**Expected discovery path:** Inventory routes and request shapes; compare frontend restrictions with API responses.

**Evidence:** Route list, request/response samples, session organization, service health.

**Expected impact:** A reliable attack-surface map enables focused testing rather than guesswork.

**Remediation:** Maintain an API inventory and centralize authorization checks.

**Instructor solution:** Use browser devtools or a proxy to observe the generated requests, then compare them with the OpenAPI contract.

**OWASP mapping:** ASVS V1, API9:2023.

**Suggested Udemy lecture:** Reconnaissance and attack-surface mapping.