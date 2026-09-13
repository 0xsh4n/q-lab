# Scenario 12 — Reporting and severity

**Objective:** Produce a report that explains the trust boundary, reproducibility, impact, and fix.

**Prerequisites:** At least one completed finding with evidence.

**Target functionality:** `student/report-template.md`.

**Expected discovery path:** Separate observed behavior from assumed impact; document secure-mode comparison.

**Evidence:** Minimal reproducible HTTP requests, response excerpts, timestamps, and screenshots where useful.

**Expected impact:** A clear report lets engineering reproduce and remediate without relying on the tester.

**Remediation:** Tie each fix to the responsible boundary and add a regression test.

**Instructor solution:** Grade for scope, evidence, deterministic steps, severity rationale, and remediation quality.

**OWASP mapping:** Applicable API and LLM categories.

**Suggested Udemy lecture:** Writing high-quality application security reports.