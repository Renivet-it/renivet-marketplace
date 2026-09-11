# Gate A — P0 / Security / Correctness Tracking Reconciliation

Re-verified 2026-08-30 against current Linear state and `qa/` source documents (not trusted from memory).

## Status of the 4 untracked P0 findings

| Finding | Linear tracking | Status in `qa/RELEASE_GATE.md` | Remains valid? |
|---|---|---|---|
| DEF-009 (`/api/permission` unauthenticated PII leak) | **UNTRACKED** — 10+ query variants against Linear returned zero matches | OPEN | Yes, unchanged |
| DEF-010 (cross-tenant bypass, 51/104 brand-router procedures) | **UNTRACKED** — REN-123/REN-124 exist but explicitly scope elsewhere (finance exports, Delhivery/Shiprocket, crons; IDOR test-matrix building) and never reference DEF-009/010 | OPEN | Yes, unchanged |
| DEF-002 (Delhivery shipment stuck "Active," AWB `34816410001083`) | **UNTRACKED** | OPEN | Yes, unchanged |
| DEF-003 (inventory double-decrement on cancellation) | **UNTRACKED** | OPEN | Yes, unchanged |

**Required tracking action (not performed by this pass, per hard boundary):** create 4 Linear issues, one per finding, each routed through the SPEC governance system at L3-equivalent risk (auth/PII/financial/inventory-adjacent, per `AGILE_PROJECT_LIFECYCLE.md`'s path-rule list).

## DEF-010 vs. P08's F10 — precise, verified relationship

**F10 is a strict SUBSET of DEF-010.** Verified by reading both source documents and current code side by side, not by re-stating the prior inference:

- DEF-010's `brands.ts` finding set (`qa/FINDINGS/DEFECT_RECORDS.md`, `qa/CROSS_TENANT_AUTHORIZATION_AUDIT.md`) names 9 vulnerable procedures: 3 subscription/billing (`createBrandSubscription`, `changeBrandSubscription`, `cancelBrandSubscription`) + 6 Unicommerce (`getUnicommerceIntegration`, `upsertUnicommerceIntegration`, `authenticateUnicommerceIntegration`, `runUnicommerceApiRequest`, `testUnicommerceIntegration`, `triggerUnicommerceSync`).
- F10 (`docs/research/brand-commerce-integration/01-renivet-current-state/FINDINGS.md`) covers exactly the same 6 Unicommerce procedures, explicitly excluding the 3 billing ones (different scope, same file).
- Current `src/lib/trpc/routes/brands/brands.ts` (lines 187/220/314/391/490/580) confirms all 6 procedures are unchanged: still missing the `input.brandId`-vs-caller's-own-brand ownership check, same root cause (`isTRPCAuth(..., "brand")` checks a permission bitfield, never compares to the target brand).
- DEF-010's full scope is 51 of 104 procedures repo-wide — F10's 6 are a named, verified instance within that set, not a duplicate and not merely "related."

**Implication:** a single fix pattern (per-procedure ownership check, already correctly implemented elsewhere in the codebase per `brand-product-type-packing.tsx`) closes F10 as one instance of DEF-010's broader fix. Recommend DEF-010 be tracked as the authoritative issue, with F10 noted as corroborating evidence, not tracked as a second, separate defect.

## Remediation specification status

None of the 4 findings has a `docs/.work-items/` folder or SPEC yet — no remediation specification exists for any of them. This is itself part of the required tracking action above.
