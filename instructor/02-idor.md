# Scenario 02 — Object access boundary (BOLA/IDOR)

**Objective:** Determine whether a document or user identifier is sufficient to cross tenants.

**Prerequisites:** Sign in as Alice (Northwind, `x-lab-user: 1`). Note a Northwind document id (`101`–`103`), then test a Meridian id such as `201`, `202`, or `203`.

**Target functionality:** `GET /api/documents/{id}` and `GET /api/users/{id}` (and the legacy `GET /api/v1/users/{id}`).

**Expected discovery path:** Change only the numeric identifier and compare the returned `tenantId`/organization.

**Evidence:** Original request, changed request, returned tenant field, leaked content (doc `203` contains synthetic PII).

**Expected impact:** Cross-tenant disclosure of synthetic knowledge, profiles, and PII.

**Remediation:** Authorize resource ownership on every object lookup against the authenticated principal's tenant; never rely on the client-selected id.

**Instructor solution:** In vulnerable mode `/api/documents/201` returns Meridian content to a Northwind user; secure mode returns `403`.

**OWASP mapping:** API1:2023 Broken Object Level Authorization.
