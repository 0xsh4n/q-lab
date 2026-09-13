# Scenario 02 — Object access boundary

**Objective:** Determine whether a document or user identifier is sufficient to cross organizations.

**Prerequisites:** Sign in as Alice and note a document ID from Acme, then test a seeded Globex ID such as `104`.

**Target functionality:** `GET /api/documents/{id}` and `GET /api/users/{id}`.

**Expected discovery path:** Change only the numeric identifier and compare the response organization.

**Evidence:** Original request, changed request, returned tenant field.

**Expected impact:** Cross-tenant disclosure of synthetic knowledge or profiles.

**Remediation:** Authorize resource ownership on every object lookup; never rely on the client-selected ID.

**Instructor solution:** In vulnerable mode, request `/api/documents/104`; switch to secure mode and repeat to observe the tenant predicate.

**OWASP mapping:** API1:2023 Broken Object Level Authorization.

**Suggested Udemy lecture:** IDOR and BOLA in REST APIs.