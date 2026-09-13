# Scenario 07 — Tool parameter manipulation

**Objective:** Test whether changing a tool parameter crosses the tenant boundary.

**Prerequisites:** Inspect the agent response and direct API calls.

**Target functionality:** `requestedTool`, document IDs, and user IDs.

**Expected discovery path:** Keep the action constant and alter only the identifier.

**Evidence:** Parameter diff and returned observation.

**Expected impact:** An otherwise harmless tool becomes an object access primitive.

**Remediation:** Resolve the current principal on the backend and scope every identifier.

**Instructor solution:** The fixture recognizes Globex identifiers in vulnerable mode and blocks them in secure mode.

**OWASP mapping:** API1:2023 Broken Object Level Authorization.

**Suggested Udemy lecture:** API parameter tampering.