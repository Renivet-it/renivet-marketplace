# REN-179 Independent Critic Review

Reviewer: independent fresh-context read-only critic (`ren175_critic`)

All required categories were reviewed: requirements/scenarios, failure/recovery, security/privacy, state/data consistency, integrations/idempotency, compatibility/migration, observability/testability, and assumptions/dependencies.

## Findings

- **DESIGN_BLOCKER DB-001** — `DEC-001`/`DEP-004`: Finance/CA has not approved the T-shirt HSN/rate or composite customization treatment. New taxable issuance must remain fail-closed until authoritative data exists; do not mark the implementation shippable with guessed values.
- **MAJOR MJ-001** — `REQ-001/002/004`, `SCN-002/007`: `createQuote` accepts caller totals without resolving/persisting HSN/rate, while `createManualQuote` trusts client GST percentage and hard-codes customization GST. Validation must happen before profile/quote writes across every quote path.
- **MAJOR MJ-002** — `REQ-002/005`, `SCN-007`: PI and tax-invoice issuance currently insert issued artifacts without a classification assertion. Renderer fallback removal alone is insufficient; issuance services need the precondition.
- **MAJOR MJ-003** — `REQ-004/005`, `SCN-006`: Multiple templates contain independent HSN/GST fallbacks (`6109`, 500, 1800 and other defaults). The consumer inventory and one-snapshot contract must cover every PI/PO/tax/settlement/export/PDF reader.
- **MAJOR MJ-004** — `REQ-006`, `SCN-009`: Invoice issuance is check-then-insert without a uniqueness/transaction lock; concurrent retries can duplicate documents. Quote numbering via `count()+1` is also race-prone.
- **MAJOR MJ-005** — `REQ-003/004`, `INV-003/004`: Manual quote, order build, and invoice template calculate tax from inconsistent sources. Define canonical per-line snapshot fields and rounding before implementation.
- **MINOR mn-001** — `REQ-002`, `SCN-007`: Add stable error code/details identifying the unresolved line and remediation, plus an audit metric for blocked classification without leaking GST/profile data.
- **MINOR mn-002** — `SCN-008`, `INV-007`: Define legacy renderer behavior concretely (not available label, regeneration/download behavior, and quote vs issued-invoice distinction).
- **MINOR mn-003** — `REQ-007`, `SCN-011`: Include HSN authority/source identifiers and snapshot timestamp/version so master changes affect only future snapshots and remain auditable.

## Non-applicable category

Migration compatibility has no non-corporate impact; additive migration/backfill must still fail closed and never invent HSN/rates.

## Disposition

DB-001 is preserved as a design blocker. The specification is revised to require pre-issuance assertions, a complete template consumer inventory, canonical line snapshot/rounding, stable structured errors, and concurrency-safe issuance. READY_FOR_DEV is not granted until Finance/CA confirms the classification dependency and the owner approves the revised contract.
