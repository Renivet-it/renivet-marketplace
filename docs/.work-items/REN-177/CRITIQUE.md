# REN-177 Independent Critic Review

Reviewer: independent fresh-context read-only critic (`ren175_critic`)

All required categories were reviewed.

## Findings

- **DESIGN_BLOCKER DB-001** — `DEC-001`, `REQ-003/005`: Finance/CA GST/composite-supply and REN-183 shipping-charge classifications are unresolved; issuance must remain fail-closed.
- **MAJOR MJ-001** — `REQ-001/002/006`: The spec must define concrete snapshot storage/version/hash, immutability, FK linkage, and an atomic write boundary; current FO insertion is direct and non-transactional.
- **MAJOR MJ-002** — `REQ-003`, `INV-002`: Current FO total excludes GST, customization, and extras; require canonical line/tax calculation before insert.
- **MAJOR MJ-003** — `REQ-002/004`, `INV-003`: FO PDF and other templates independently recompute order/quote values; require exhaustive consumer inventory and no silent fallback/recomputation.
- **MAJOR MJ-004** — `REQ-006/007`, `INV-006`: FO idempotency is check-then-insert without an issued-order uniqueness/CAS primitive.
- **MAJOR MJ-005** — `REQ-005`, `INV-005`: Delivery responsibility and freight classification need explicit immutable fields, not only enum/address.
- **MAJOR MJ-006** — `REQ-002/006`: Admin FO Packaging/Extras input/schema parity is missing and causes silent-drop risk.
- **MINOR mn-001** — `REQ-007`, `INV-008`: Define legacy-unavailable markers, migration audit, and renderer behavior.
- **MINOR mn-002** — Security: PDF/read endpoints need explicit order/tenant authorization checks.
- **MINOR mn-003** — Add structured snapshot-validation/rollback/conflict errors and issuance correlation IDs.

## Disposition

DB-001 is preserved. The implementation contract must add the concrete snapshot schema/version/immutability and transaction design, reconcile FO totals, remove all downstream recomputation, define delivery and legacy policies, and close the FO UI/schema gap before `READY_FOR_DEV`.
