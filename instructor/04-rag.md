# Scenario 04 — Cross-tenant RAG authorization

**Objective:** Verify that retrieval applies organization scope before returning context.

**Prerequisites:** Sign in as Alice and use Search.

**Target functionality:** `POST /api/search` and the document list.

**Expected discovery path:** Search for terms that occur only in the Globex fixtures and inspect the returned organization.

**Evidence:** Query, ranked results, source organization.

**Expected impact:** Cross-tenant knowledge disclosure through a semantically authorized feature.

**Remediation:** Apply tenant filtering before vector search or use tenant-partitioned collections.

**Instructor solution:** Vulnerable mode permits matching Globex fixtures; secure mode scopes retrieval to Acme.

**OWASP mapping:** LLM06:2025 Excessive Agency / API1:2023.

**Suggested Udemy lecture:** Multi-tenant RAG authorization.