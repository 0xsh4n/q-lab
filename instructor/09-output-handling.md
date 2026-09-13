# Scenario 09 — Output handling

**Objective:** Identify where generated content would cross into an HTML or browser context.

**Prerequisites:** Review the chat response and frontend rendering path.

**Target functionality:** Model output rendering.

**Expected discovery path:** Trace response text from the API to the DOM and determine whether it is treated as text or trusted markup.

**Evidence:** Rendered text, DOM inspection, output handling code.

**Expected impact:** In a real renderer, unsafe HTML could create stored or reflected script execution inside the lab.

**Remediation:** Render model output as text or sanitize with a strict allowlist; use a strong CSP.

**Instructor solution:** The lab keeps the payload synthetic and bounded; the lesson is to inspect the sink rather than assume model output is safe.

**OWASP mapping:** LLM05:2025 Improper Output Handling.

**Suggested Udemy lecture:** AI output validation and XSS boundaries.