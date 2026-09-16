# Scenario 01 — Reconnaissance and API mapping

**Objective:** Build a route, identity, data, and trust-boundary map before exploiting anything.

**Prerequisites:** Start the lab and sign in as `alice@northwind.example` (password `Password123!`).

**Target functionality:** Navigation, browser network requests, `/api/healthz`, `/api/auth/session`, `/api/lab/vulnerabilities`, and any versioned or internal routes (`/api/v1/*`, `/api/internal/*`, `/api/openapi.json`).

**Expected discovery path:** Inventory routes and request shapes from the network tab; look for deprecated `v1` endpoints and unauthenticated `internal` endpoints; compare frontend restrictions with API responses.

**Evidence:** Route list, request/response samples, session tenant/role, service health, discovered inventory.

**Expected impact:** A reliable attack-surface map (including forgotten `v1`/`internal` surface) enables focused testing.

**Remediation:** Maintain an accurate API inventory; decommission deprecated versions; centralize authorization.

**Instructor solution:** Point students at `/api/v1/sessions`, `/api/internal/config`, and `/api/openapi.json` to show improper inventory (API9:2023).

**OWASP mapping:** API9:2023, API8:2023, ASVS V1.
