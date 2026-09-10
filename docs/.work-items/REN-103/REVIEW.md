# REVIEW: REN-103 — Type safety erosion — finance router increment

## Executive Result

REVIEW_FAILED. MATERIAL_DRIFT: the requested visibility-only slice is not present in the authoritative base-to-head diff, and the two target helpers remain explicitly typed with `any`. Governance re-entry is required.

## Review Scope and Git Evidence

Compared `origin/master` (`767906d507f39a7816f752399482c5de883ea16a`) to HEAD (`383311be5f3db3765f6f18e7dd68f89527e29c90`) on `ayanganguly333/ren-103-finance-router-types`. Linear REN-103 is Backlog and describes an incremental type-safety task; the approved local contract is READY_FOR_DEV/APPROVED. The worktree has pre-existing governance-only changes: `REVIEW.md` deleted, `SPEC.md` modified, and `work-item.yaml` modified; application source is clean.

## Requirement Reconciliation

REQ-001/REQ-008 fail for this requested slice: `src/lib/db/queries/product.ts:231` has `isPublicProductVisible = (product: any)`, and line 240 has `row: { product?: any }`. The predicate itself checks existence, active, available, published, not deleted, approved, and active brand, but the required named shapes are absent. No corresponding visibility hunk exists in the base-to-head diff.

REQ-002–REQ-007 are outside this new visibility-only slice; the existing branch contains their earlier finance, quantity, and parser increments, but they are not re-verified as part of this finding.

## Scenario Reconciliation

SCN-007 fails because the helpers do not use named product/section-row shapes. The predicate and delegation are present, but the required unsafe-any regression outcome is not met. SCN-001–SCN-006 are not applicable to the requested new slice.

## Invariant Reconciliation

INV-005 is only partially satisfied: the runtime predicate is unchanged, but the type-safety invariant for the requested helper boundary is violated. INV-001–INV-004 are outside this slice.

## Flow and Architecture Review

FLOW-002 is relevant. Existing section consumers filter through `isPublicSectionProductRow` (for example lines 3849, 3919, 3989, 4060, 4150, 4220, 4290, 4360, 4430, 4500, 4570, and 4640), so changing the boundary types can remain local. No schema, migration, API, or database change is evidenced.

## Security and Integration Review

The runtime visibility predicate does not broaden or narrow in the inspected implementation. However, this is a public-catalog trust boundary (SEC-001/REQ-008), and the requested compile-time hardening is absent. No external integration or idempotency behavior is changed or applicable.

## Scope and Drift Review

The requested new slice is limited to two type annotations in `product.ts`; the authoritative diff does not contain those changes. This is MATERIAL_DRIFT against REQ-008/SCN-007/TEXP-006, not a harmless implementation variation.

## Test Expectation Review

TEXP-006 is not evidenced as satisfied: no visibility-helper source-guard change or focused test change appears in the base-to-head diff. Static inspection only; tests were not executed by REVIEW.

## Findings

### REV-001

- Severity: BLOCKER
- Category: requirement
- Description: The requested visibility slice is missing; both public visibility helpers still use explicit `any` annotations.
- Evidence: REQ-001, REQ-008, SCN-007, INV-005, TEXP-006; `src/lib/db/queries/product.ts:231` and `:240`; no matching hunk in `origin/master...383311be`.
- Impact: The public visibility type-safety boundary remains unaddressed and the required regression guard cannot pass.
- Recommendation: Add named product and section-row input shapes for the two helpers, preserve the exact predicate/delegation, add the required focused source guard, then rerun SPEC governance and REVIEW.

## Decisions Requiring Attention

None.

## Final Recommendation

Do not mark READY. Resolve REV-001 and rerun governance validation and the independent review. Governance re-entry is required because the implementation does not match the approved/requested slice.
