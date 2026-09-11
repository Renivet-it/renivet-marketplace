# Linear Execution Preparation

**No Linear issues were created or modified to produce this document.** Every row below is either (a) an existing Linear issue, referenced by its real ID, verified this session via direct Linear API query, or (b) a **NEW** issue this program recommends creating, sourced only from already-completed research/audit findings — no fake user stories or invented scope. This is the pre-flight checklist for whoever is authorized to create Linear issues, not a substitute for that action.

## Track A — Urgent safety (independent of Epic authorization, proceed immediately)

### A1. DEF-009 — `/api/permission` unauthenticated PII leak

| Field | Value |
|---|---|
| Epic | Cross-cutting (`XC-SEC-001`) |
| Capability | N/A — finding-driven, not persona-driven |
| Linear issue | **NEW** |
| Title | Unauthenticated `/api/permission` endpoint leaks PII |
| Purpose | Close an open, confirmed-untracked P0 security finding before any further security-adjacent work proceeds |
| Evidence | `qa/FINDINGS/DEFECT_RECORDS.md` (DEF-009); `qa/RELEASE_GATE.md` status OPEN, re-verified 2026-08-30 |
| Dependencies | None |
| Priority | Urgent (P0) |
| Required SPEC | Yes — route at L3-equivalent risk (auth/PII path) per `AGILE_PROJECT_LIFECYCLE.md` |
| Required TEST | Confirm endpoint requires authentication; confirm no PII is returned to an unauthenticated caller |
| Rollback | Standard code revert; no schema/infra impact expected |
| Acceptance criteria | Unauthenticated request to `/api/permission` returns 401/403, not PII |
| Related audit | `qa/FINDINGS/DEFECT_RECORDS.md`, `qa/RELEASE_GATE.md` |
| Related SRS section | N/A (not part of the P08 SRS) |

### A2. DEF-010 — cross-tenant authorization bypass (51/104 brand-router procedures)

| Field | Value |
|---|---|
| Epic | Cross-cutting (`XC-SEC-001`) |
| Capability | N/A — finding-driven |
| Linear issue | **NEW** (authoritative issue — F10 folds into this, do not create a second issue for F10) |
| Title | Cross-tenant authorization bypass across 51 brand-router procedures (includes F10's 6 Unicommerce procedures) |
| Purpose | Close the single broadest untracked P0 security finding in the portfolio; closing it also closes P08's F10 as a byproduct |
| Evidence | `qa/FINDINGS/DEFECT_RECORDS.md`, `qa/CROSS_TENANT_AUTHORIZATION_AUDIT.md` (51/104 procedures); this session's direct re-read of `src/lib/trpc/routes/brands/brands.ts` lines 193/231/320/412/497/587/633 confirming `isTRPCAuth(..., "brand")` never compares `input.brandId` to the caller's own brand; correct pattern already exists elsewhere in the codebase at `brand-product-type-packing.tsx` |
| Dependencies | None. Closing this also resolves P08's F10 (`docs/research/brand-commerce-integration/01-renivet-current-state/FINDINGS.md`) — confirmed a strict subset, not a duplicate |
| Priority | Urgent (P0) |
| Required SPEC | Yes — L3-equivalent risk; single fix pattern (per-procedure ownership check) applied across all 51 procedures, not just the 6 Unicommerce ones |
| Required TEST | Automated test per procedure: brand-admin A calling with `input.brandId` = brand B is rejected. For the 6 Unicommerce procedures specifically, this satisfies P08's AC-31 |
| Rollback | Standard code revert per procedure; no schema change |
| Acceptance criteria | All 51 procedures reject a caller whose own brand does not match `input.brandId` |
| Related audit | `qa/CROSS_TENANT_AUTHORIZATION_AUDIT.md`, `08-risks/PORTFOLIO_RISK_REGISTER.md` |
| Related SRS section | P08 `03-requirements/FUNCTIONAL_REQUIREMENTS.md` FR-17, `03-requirements/ACCEPTANCE_CRITERIA.md` AC-31 (F10 subset only) |

### A3. DEF-002 — Delhivery shipment stuck "Active" (AWB `34816410001083`)

| Field | Value |
|---|---|
| Epic | Cross-cutting (`XC-INFRA-001`) |
| Capability | N/A |
| Linear issue | **NEW** |
| Title | Delhivery shipment permanently stuck in "Active" state, no reconciliation path |
| Purpose | Close a confirmed-untracked P0 operational/customer-impact defect |
| Evidence | `qa/FINDINGS/DEFECT_RECORDS.md` (DEF-002), AWB `34816410001083` |
| Dependencies | None |
| Priority | Urgent (P0) |
| Required SPEC | Yes |
| Required TEST | Reproduce the stuck-state condition; confirm a reconciliation/alerting path exists post-fix |
| Rollback | Standard code revert |
| Acceptance criteria | Shipment status reconciliation has a defined terminal path; no shipment can remain "Active" indefinitely with no operator visibility |
| Related audit | `qa/FINDINGS/DEFECT_RECORDS.md` |
| Related SRS section | N/A |

### A4. DEF-003 — inventory double-decrement on cancellation

| Field | Value |
|---|---|
| Epic | Cross-cutting (`XC-INFRA-001`) |
| Capability | N/A |
| Linear issue | **NEW** |
| Title | Inventory double-decremented on order cancellation |
| Purpose | Close a confirmed-untracked P0 financial/inventory-integrity defect |
| Evidence | `qa/FINDINGS/DEFECT_RECORDS.md` (DEF-003) |
| Dependencies | None. Worth coordinating with REN-144 (both touch order-state integrity) but not blocking either way |
| Priority | Urgent (P0) |
| Required SPEC | Yes — L3-equivalent risk (financial/inventory-adjacent) |
| Required TEST | Cancel an order; confirm inventory is restored exactly once, not twice |
| Rollback | Standard code revert |
| Acceptance criteria | Inventory delta on cancellation is exactly the reverse of the original decrement, verified by test |
| Related audit | `qa/FINDINGS/DEFECT_RECORDS.md` |
| Related SRS section | N/A |

## Track A — existing issues requiring a process action, not creation

| Issue | Action required | Why | Evidence |
|---|---|---|---|
| REN-143 | Fill in `PHASE-A-EVIDENCE.md`/`PHASE-B-EVIDENCE.md` placeholders (`Approver`, deployment IDs, rollback-test results, before/after build counts); get a named Approver | Linear shows "Deployed to Prod" but the work item's own `work-item.yaml` shows `task.status: IN_REVIEW` — a direct contradiction confirmed this session against the actual Linear record | `work-item.yaml`, `PHASE-A-EVIDENCE.md`, `PHASE-B-EVIDENCE.md` |
| REN-95 | Re-run the SPEC pilot; this time commit `docs/.work-items/REN-95/` for real | The original 6 decisions (`DEC-001`–`006`) exist only as topic labels — the actual question/recommendation text was lost when the pilot worktree (`codex/renivet-spec-governance`) was discarded, never merged | `CODEX_SPEC_IMPLEMENTATION_REPORT.md` §6/§14/§19; confirmed via `git ls-tree`/`git cat-file -e` this document's authoring pass found no trace on any branch |

## Track B — P01/P02 sequencing (existing issues, no new issue needed)

| Issue | Sequencing note |
|---|---|
| REN-146 | Implement first — mechanical fix (timeouts + real env-var config) across 5 live files (corrected from P01's own undercount of 4). Confirmed `Backlog` this session. |
| REN-151 | Same PR as REN-146, or immediately after — both hit `product.ts:1177-1230`. |
| REN-147 | Rebase on REN-146 once it lands — REN-146 already satisfies P02's own FR-1.4 requirement; REN-147's remaining scope (new `cart.ts` fallback chain) doesn't re-touch the shared files. |
| REN-160 | Parallel with or after REN-147 — additive caching, low conflict. |
| REN-144 | Implement — fully specified, zero remaining unknowns beyond effort. Confirmed `Backlog`, Urgent, this session. |
| REN-131 | **Do not start until REN-144 ships.** Re-validate its dedup design (`DEC-131-001`) against REN-144's actual implementation once it exists. Confirmed `Backlog`, High, assigned, this session — description confirmed to never reference REN-133 or REN-144. |
| REN-133 | **Do not start until REN-131 exists.** `/SPEC` must explicitly cite REN-131's dedup identifier. Confirmed exists in Linear (`Backlog`, Medium, assigned) — corrects an earlier claim that no issue existed; scope is purely client-side helper extraction. |

## Track C — P08 (create only after the Gate F authorization decision — do not create pre-authorization)

Source: P08's own `12-traceability/STORY_TO_ISSUE.md` (10 user stories, all currently "NOT YET CREATED"). F10's row is deliberately **excluded** here — it is not a separate P08 issue; it is closed via A2 (DEF-010) above.

| # | Epic | Capability / User story | Linear issue | Title | Purpose | Evidence | Dependencies | Priority | Required SPEC | Required TEST | Rollback | Acceptance criteria | Related audit | Related SRS section |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 | P08 | Dry-run/preview before write | NEW | Dry-run diff + explicit approval gate before any File-First write | No write from an untrusted external file happens without human-visible preview | `07-feasibility/`, `16-final/POC_PLAN.md` | Gate F authorization; C6 (write/provenance) | High | Yes | AC-13–16 | Feature-flaggable; no schema migration for the gate itself | AC-13, AC-14, AC-15, AC-16 | P08 research `16-final/` | FR-12, FR-13 |
| C2 | P08 | Explainable mapping failures | NEW | Human-readable reasons for unmapped columns/unresolved rows | Brand admin can act on a failure without engineering support | `05-identity-and-mapping/SCHEMA_MAPPING.md` | C3 (schema mapping engine) | Medium | Yes | AC-4, AC-7, AC-23 | N/A (UI/messaging only) | AC-4, AC-7, AC-23 | P08 SRS `03-requirements/` | FR-5, FR-8 |
| C3 | P08 | Mapping memory across uploads | NEW | Confirmed column/attribute mappings persist per brand, reused without re-prompting | Avoids re-asking a brand the same mapping question every upload | `05-identity-and-mapping/SCHEMA_MAPPING.md` Phase 2 | Deterministic mapping engine (FR-4) | High | Yes | AC-5, AC-6 | Additive table/columns only | AC-5, AC-6 | P08 SRS | FR-6 |
| C4 | P08 | Never silently mismatched to the wrong variant | NEW | Exact-match-only identity resolution; ambiguous rows held, never auto-matched | Highest-cost failure mode (right product, wrong size/color) named explicitly by the corrected design | `15-synthesis/SYNTHESIS.md` §2 | C1 (dry-run gate) | High | Yes | AC-9–12, AC-24, AC-25 | N/A | AC-9, AC-10, AC-11, AC-12, AC-24, AC-25 | P08 SRS, `15-synthesis/SYNTHESIS.md` | FR-9, FR-10, FR-11 |
| C5 | P08 | Plain-language validation errors | NEW | Structural/type/range validation surfaced in brand-admin-readable form | Same purpose as C2, scoped to validation rather than mapping | `06-sync-and-reconciliation/` | C1 | Medium | Yes | AC-13, AC-14, AC-27 | N/A | AC-13, AC-14, AC-27 | P08 SRS | FR-12 |
| C6 | P08 | Schema drift doesn't silently break my sync | NEW | Detect and surface missing/renamed/retyped columns vs. prior upload; hard-fail rather than null-write | Prevents silently overwriting good data with nulls | `05-identity-and-mapping/SCHEMA_DRIFT.md` | C3 | High | Yes | AC-6, AC-7, AC-26 | N/A | AC-6, AC-7, AC-26 | P08 SRS | FR-8 |
| C7 | P08 | Partial failure is visible, not all-or-nothing | NEW | Import-batch + import-record model; per-row status, no full-batch rollback on partial failure | Core V1 data-model requirement, re-confirmed smallest-safe design (Gate 22) | `12-DATABASE_FEASIBILITY.md` (this directory); confirmed this session: zero existing `import_batch`/`import_record` schema — genuinely new, not duplicative | None (foundational — other C-items depend on this) | High | Yes | AC-18–20, AC-29, AC-30 | Additive schema only (new tables); reversible migration | AC-18, AC-19, AC-20, AC-29, AC-30 | P08 SRS, Gate 22 | FR-15, FR-16 |
| C8 | P08 | Existing Unicommerce brand gets real mapping/preview | NEW | Extend `product-import.tsx` (post-`xlsx` upgrade) as the File-First entry point for brands already on Unicommerce | Ties the whole V1 flow to the one importer that already exists, rather than building a parallel path | `00-context/CURRENT_STATE.md` (F9, S5 — vulnerable `xlsx@0.18.5` unfixed as of this pass) | C1, C3, C4, C6, C7 | High | Yes | AC-1, AC-2 | Dependency upgrade is itself reversible | AC-1, AC-2 | P08 SRS | FR-1, FR-2, FR-3 |
| C9 | P08 | Confidence that another brand can never see my integration | Folded into **A2 (DEF-010)** | N/A — do not create a separate P08 issue | F10 is a verified strict subset of DEF-010; a second issue would be a duplicate | — | A2 | — | — | — | — | AC-31 | — | FR-17 (fold into A2's scope) |
| C10 | P08 | Renivet ops can see what happened per batch | NEW | Per-batch operator-facing log/dashboard view (file, brand, rows succeeded/failed, timestamp, resulting row IDs) | Operational visibility companion to C7's data model | `06-sync-and-reconciliation/` | C7 | Medium | Yes | AC-18 | N/A (read-only view) | AC-18 | P08 SRS | FR-15 |

**Do not create C1–C8/C10 until the Gate F leadership authorization decision is made** (`06-P08_AUTHORIZATION.md`, `18-FINAL_PORTFOLIO_READINESS.md`). This table exists so that decision, once made, can be acted on immediately rather than re-deriving scope from scratch.

## Confirmation

No Linear issue was created or modified in the production of this document. All existing-issue statuses cited above were fetched live from Linear this session, not assumed from a prior pass's record.
