# Scenario 03 — Direct prompt injection

**Objective:** Test whether user text can override the assistant's intended support policy.

**Prerequisites:** Open Chat.

**Target functionality:** `POST /api/chat`.

**Expected discovery path:** Ask a normal support question, then test instruction-hierarchy language and compare the model response and safety label.

**Evidence:** Message, citations, response, model label.

**Expected impact:** Context leakage or unsafe guidance from a model that treats user text as policy.

**Remediation:** Keep system policy separate, treat user content as data, and validate model outputs server-side.

**Instructor solution:** The deterministic fixture responds differently to instruction-like text in vulnerable mode without requiring a single magic phrase.

**OWASP mapping:** OWASP LLM01:2025 Prompt Injection.

**Suggested Udemy lecture:** Instruction hierarchy and AI trust boundaries.