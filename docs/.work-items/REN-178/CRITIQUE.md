# REN-178 Independent Critic Review

Reviewer: independent fresh-context read-only critic (`ren176_critic`)

All required categories were reviewed.

## Findings

- **DESIGN_BLOCKER REN178-CRIT-001** — `DEP-001`/`REQ-001`: REN-177 snapshot schema/version is unresolved, so a single authoritative model and rollout gate cannot yet be guaranteed.
- **DESIGN_BLOCKER REN178-CRIT-002** — `DEC-001`/`REQ-007`: Existing service, invoice template, and FO UI hard-code 18% customization GST; the spec must define removal/legacy behavior before release.
- **MAJOR REN178-CRIT-003** — `REQ-001`: Existing `corporateCustomizations` lacks explicit identity, parent line, name, description, basis, quantity, instruction, artwork, display order, tax metadata, and snapshot/version fields.
- **MAJOR REN178-CRIT-004** — `INV-001`, `SCN-008`: No database uniqueness/source-row identity guarantees exactly-once customization rows under retries or concurrency.
- **MAJOR REN178-CRIT-005** — `REQ-004`, `INV-002`: Basis/rounding and zero/flat/per-unit residual allocation are underspecified and can cause paise divergence.
- **MAJOR REN178-CRIT-006** — `REQ-003`, `SCN-005`: FO persistence, immutable snapshot linkage, edit blocking, and stale-version conflict behavior are not concrete.
- **MAJOR REN178-CRIT-007** — `REQ-006`, `SCN-010`: Legacy backfill lacks deterministic source selection, marker, rerun safety, and issued-document policy.
- **MAJOR REN178-CRIT-008** — `REQ-005`, `INV-005`: URL ownership, signed-read authorization, content verification, and orphan cleanup need concrete server-side controls.
- **MAJOR REN178-CRIT-009** — `REQ-008`, `INV-004`: Cross-document transaction/outbox/version-pinning behavior is unspecified, allowing stale or partial downstream documents.
- **MINOR REN178-CRIT-010** — Observability lacks structured reconciliation/version errors, metrics, and audit correlation IDs.
- **MINOR REN178-CRIT-011** — Tests should cover zero/overflow/many-line/duplicate-order/rounding/migration-rerun and old-document regeneration cases.

## Disposition

The two design blockers are preserved. The implementation must first align with REN-177’s concrete snapshot contract and remove existing inferred 18% tax behavior; Finance/CA treatment remains outside this task. The remaining findings are required design refinements before `READY_FOR_DEV`.
