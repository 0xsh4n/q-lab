# Scenario 09 — Output handling

**Objective:** Identify where generated content would cross into an HTML or browser context.

**Prerequisites:** Review the chat response and frontend rendering path.

**Target functionality:** Model output rendering.

**Expected discovery path:** In vulnerable mode, a prompt-injection message makes `/api/chat` return `format:"html"` with an `<img onerror=...>` payload; the Assistant page renders assistant HTML via `dangerouslySetInnerHTML`, so the payload executes in the browser.

**Evidence:** The `format:"html"` response body, the executed alert, and the rendering code path.

**Expected impact:** Stored/reflected XSS driven by model output — session-token theft from `localStorage`, request forgery, workspace takeover.

**Remediation:** Render model output as text by default; if rich text is required, sanitize with a strict allowlist and apply a strong CSP. Never trust model output as safe markup.

**Instructor solution:** Secure mode returns text-only output and the UI uses no HTML sink; compare the two renders side by side.

**OWASP mapping:** LLM05:2025 Improper Output Handling.

**Suggested Udemy lecture:** AI output validation and XSS boundaries.