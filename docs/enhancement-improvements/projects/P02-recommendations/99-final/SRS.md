# Software Requirements Specification — P02 Recommendations & Personalization

## 1. Purpose

This SRS specifies requirements to remediate four confirmed defects across Renivet's three live recommendation surfaces (cart cross-sell, PDP similar-products, shop-page personalized sort), and to properly scope two non-committed items (one verification-only, one explicitly deferred). It supersedes no prior document — none existed for this Epic (`00-context/README.md`).

## 2. Scope

In scope: REN-147, REN-150, REN-157, REN-160 (build). REN-165 (verification only). REN-168 (explicitly deferred, documented but not designed). Out of scope: RE-F008, any new merchandiser tooling, any diversity/ranking-model rework beyond REN-150's narrow fix, any shared-service architectural refactor (see `../11-critique/ANTI_OVERENGINEERING_REVIEW.md`).

## 3. System overview

See `../04-architecture/SYSTEM_ARCHITECTURE.md`. Three architecturally distinct placements: two ML-host-dependent (cart, PDP, sharing one function), one Postgres-only (shop-page sort).

## 4. Functional requirements

See `../03-requirements/FUNCTIONAL_REQUIREMENTS.md` (FR-1 through FR-6).

## 5. Non-functional requirements

See `../03-requirements/NON_FUNCTIONAL_REQUIREMENTS.md` (NFR-1 through NFR-8).

## 6. Business rules

See `../03-requirements/BUSINESS_RULES.md` (BR-1 through BR-6).

## 7. Acceptance criteria

See `../03-requirements/ACCEPTANCE_CRITERIA.md` (AC-1 through AC-6).

## 8. Data requirements and contracts

See `../06-data/DATA_REQUIREMENTS.md` and `DATA_CONTRACTS.md`.

## 9. Reliability, security, performance

See `../08-reliability/` (FAILURE_MATRIX, SECURITY, PERFORMANCE, OBSERVABILITY, RECOVERY_ROLLBACK).

## 10. Validation

See `../09-validation/` (TEST_STRATEGY, EXPERIMENT_STRATEGY, SUCCESS_METRICS).

## 11. Roadmap

V1 = the four confirmed fixes. V2 = conditional REN-165 build. V3 = gated REN-168. See `../10-roadmap/`.

## 12. Traceability

Every requirement traces to exactly one of six Linear issues, each of which traces to a portfolio-level audit finding. See `../12-traceability/`.

## 13. Classification discipline statement

Every material claim throughout this package's files is tagged CONFIRMED (verified against live source this pass), INFERRED (reasonable, not directly observed), UNKNOWN (not determinable), or DECISION REQUIRED (needs a business/product call). No PROBABLE-confidence audit finding (REN-165) has been upgraded to a confirmed requirement anywhere in this package. No deferred item (REN-168) has been designed in detail or implied as approved.

## 14. Open items

See `OPEN_DECISIONS.md`.
