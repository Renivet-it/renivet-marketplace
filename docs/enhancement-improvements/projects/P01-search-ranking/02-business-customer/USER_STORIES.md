# User Stories — P01

Per the governance rule for this package: a user story is only written where a **real user/business capability** exists, not as a wrapper around an engineering task. Given this Epic's backlog is almost entirely deterministic hardening (timeouts, parallelization, caching, dead-code removal, one logging stub), there are genuinely few real stories here — that is expected, not a gap to fill.

## US-1 — Relevant results for what I typed
**As a** shopper, **I want** search results ranked by relevance to what I typed **so that** I find what I'm looking for without scrolling past irrelevant items.
- Underlying mechanism: Subsystem A (`getProducts`) RAG ranking + ILIKE fallback — already exists (CONFIRMED). This Epic does not change ranking logic itself; it fixes correctness/latency around it (REN-146/151/158).
- Traceability: `12-traceability/STORY_TO_ISSUE.md`.

## US-2 — Land where I meant to go
**As a** shopper who searches a brand or category name I already know, **I want** to be taken directly to that brand or category **so that** I don't have to re-filter a generic result list myself.
- Underlying mechanism: Subsystem B intent classification — computed today but discarded (REN-149 bug). This is the one story where fixing an engineering defect directly restores an intended, real user-facing capability.
- Traceability: `12-traceability/STORY_TO_ISSUE.md`.

## US-3 — Trustworthy result counts
**As a** shopper browsing a catalog page, **I want** the "N products" count to match what I can actually scroll through **so that** I don't feel misled by a number that shrinks after I look.
- Underlying mechanism: REN-155's count/filter-order mismatch.
- Traceability: `12-traceability/STORY_TO_ISSUE.md`.

## Explicitly not written as stories (engineering requirements instead)

The following belong in `03-requirements/FUNCTIONAL_REQUIREMENTS.md` / `NON_FUNCTIONAL_REQUIREMENTS.md`, not here, because no real user capability changes:
- "As a developer, I want a request timeout on the ML service client..." (REN-146) — no user-visible behavior change on the happy path; only changes failure-mode behavior.
- "As an engineer, I want independent external calls parallelized..." (REN-151) — a latency improvement, not a new capability; captured as an NFR.
- REN-156, REN-158, REN-159 — pure engineering waste-removal, no user story applies.
- REN-154 (click logging) — an internal measurement capability, not a customer-facing story; it enables future stories but is not one itself.
