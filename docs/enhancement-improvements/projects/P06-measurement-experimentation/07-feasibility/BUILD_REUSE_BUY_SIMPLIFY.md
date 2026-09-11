# Build / Reuse / Buy / Simplify — P06

## REN-145, 131, 132, 133, 134 — SIMPLIFY / fix-in-place
All are fixes to existing, already-integrated systems. No build-vs-buy question applies — there is nothing to buy (PostHog, Meta CAPI/Pixel are already the chosen vendors) and nothing new to build. The correct move is the smallest possible in-place fix: unit conversion, event-firing consolidation, a rename. Explicitly reject the temptation to use REN-145's urgency as justification for building a general "commerce event bus" abstraction first — see `11-critique/ANTI_OVERENGINEERING_REVIEW.md`.

## REN-166 (GA4) — BUY is already done; this is BUILD (instrumentation), gated on a decision
Renivet already has a GA4 property (session data flows via Windsor.ai). The "buy" decision (which analytics vendor) is not in question; the open question is a product decision (is a third revenue-reporting source worth the instrumentation cost), not a technical one. Do not build until DECISION-P06-001 resolves.

## REN-164 — REUSE existing test/QA tooling
No new tooling is needed; this is a focused manual/automated verification using existing dev-environment tooling (browser devtools network/console inspection of `posthog-js` init timing).

## Explicitly rejected option: building a unified `emitCommerceEvent()` abstraction now
Considered and rejected for V1. Would reduce future duplication (nice-to-have) but is not required to fix any of REN-131/132/133/134/145, adds design/review surface area to a fix-list that includes a P0-urgent item, and risks delaying the urgent fix. Revisit only as a V2/V3 candidate if GA4 is approved and the fan-out grows to four systems (see `10-roadmap/V2.md`).
