# Software Requirements Specification — P06 Measurement & Experimentation

## 1. Purpose
Correct Renivet's customer-behavior measurement layer (PostHog, Meta CAPI/Pixel; GA4 conditionally) so that ad-spend and product decisions are built on trustworthy data. See `00-context/README.md` for full scope framing.

## 2. Scope
In scope: fixing five source-confirmed instrumentation defects/gaps in already-shipped code (REN-145, 131, 132, 133, 134). Conditionally in scope (V2+): GA4 instrumentation (REN-166), gated on DECISION-P06-001. Out of scope: any new analytics capability, any ML/attribution model, any CAC/LTV/ROI computation, any Linear issue creation, any deployment.

## 3. Requirements
See `03-requirements/FUNCTIONAL_REQUIREMENTS.md`, `NON_FUNCTIONAL_REQUIREMENTS.md`, `BUSINESS_RULES.md`, `ACCEPTANCE_CRITERIA.md` for the full normative requirement set (FR-1 through FR-8, NFR-1 through NFR-6, BRULE-1 through BRULE-5).

## 4. Architecture summary
Three independently-integrated systems (PostHog, Meta Pixel/CAPI, absent-GA4) with no shared commerce-event abstraction; purchase-completion tracking lives in two duplicated client-side `onSuccess` handlers. Full detail in `04-architecture/`.

## 5. Algorithm summary
"Algorithm" = event definitions, identity resolution, attribution delegation, funnel semantics, cross-system reconciliation. Full detail, including the mechanistic explanation for the 11/15/2/0 purchase-count discrepancy, in `05-algorithms/`.

## 6. Data
Purchase-count discrepancy across Meta/PostHog-raw/PostHog-strict/GA4 documented with explicit measurement-artifact caveats in `06-data/DATA_QUALITY.md`. No CAC/LTV/ROI computation performed or implied anywhere in this package.

## 7. Key finding classifications (do not weaken or strengthen on restatement)
- **REN-145 currency-unit defect: CONFIRMED at the source-code level** (both files, both Pixel and CAPI call sites).
- **REN-145 per-brand fan-out: CONFIRMED at the source-code level** (`buildOrderDetailsByBrand()` + per-brand `createOrder` loop, both files).
- **REN-145 historical/full-period runtime impact on actual ad spend: PROBABLE, not CONFIRMED** — one real month of data did not cleanly fit the expected clean-multiplier theory during QC.
- **PostHog-strict purchase count of 2: a measurement artifact of strict-mode filtering**, not evidence that only 2 real purchases occurred.
- **GA4 purchases of 0: because the event is unwired, not because zero purchases happened.**
- **REN-164: verification-only, not a confirmed defect.**
- **REN-166: explicitly deferred, gated on a product decision (DECISION-P06-001), not an engineering-readiness signal.**

## 8. Business finding (non-engineering, flagged prominently)
`Remarketing_Sara` generated 82% of Meta-attributed purchases at a 4.9x better CPA and is currently paused — an immediately actionable marketing decision, independent of any engineering fix. See `00-context/BUSINESS_CONTEXT.md`.

## 9. Reliability
Failure matrix, security, performance, observability, and recovery/rollback fully addressed in `08-reliability/`. The currency-unit defect is explicitly the most dangerous failure mode documented (silent data corruption, no crash).

## 10. Validation
Test and experiment strategy in `09-validation/`. No new randomized experiment is warranted (bug-fix, not a design choice); a before/after reconciliation comparison is the appropriate validation method.

## 11. Roadmap
V1 = REN-145, 131, 132, 133, 134. V2/V3 = REN-166 (gated) and REN-164 close-out (conditional on verification finding a real defect). Full detail in `10-roadmap/`.

## 12. Traceability
Full audit→epic, story→issue, and issue→task mappings in `12-traceability/`.
