# Scenario 04 — Cross-tenant RAG / vector retrieval

**Objective:** Verify that retrieval applies tenant scope before returning context.

**Prerequisites:** Sign in as Alice (Northwind) and use Search, plus `POST /api/ai/embeddings/search`.

**Target functionality:** `POST /api/search` and `POST /api/ai/embeddings/search`.

**Expected discovery path:** Search for terms that occur only in the Meridian fixtures (e.g. "patient MRN renewal") and inspect the returned `tenantId`/organization on the results.

**Evidence:** Query, ranked results, source tenant, leaked chunk content.

**Expected impact:** Cross-tenant knowledge and PII disclosure through a semantically "authorized" feature (embedding recall over a shared index).

**Remediation:** Filter by tenant before vector search, or use tenant-partitioned collections; never search the global index and filter afterward.

**Instructor solution:** Vulnerable mode returns Meridian (tenant 2) neighbors to a Northwind (tenant 1) caller; secure mode scopes retrieval to the caller's tenant.

**OWASP mapping:** LLM08:2025 Vector & Embedding Weaknesses / API1:2023.
