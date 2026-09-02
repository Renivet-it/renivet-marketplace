# REN-178 Critic Review

Independent fresh-context, read-only review of the REN-178 contract and repository.

### CRIT-178-01 — BLOCKER

The existing `corporateCustomizations` table lacks the required product/order-line parent, descriptive fields, quantity/basis, production instruction, artwork/reference, tax treatment, display order, and immutable snapshot/version.

### CRIT-178-02 — BLOCKER

The canonical commercial snapshot must explicitly contain ordered customization records and a stable revision. Current PI, FO, invoice, and settlement tables contain aggregates only.

### CRIT-178-03 — HIGH

Parent and customization writes are not consistently atomic. Require transactions, rollback behavior, and retry/idempotency semantics.

### CRIT-178-04 — HIGH

FO issuance currently drops extras and computes totals independently. FO must read/validate the canonical snapshot and prevent duplicate concurrent issuance.

### CRIT-178-05 — HIGH

Quote revisions do not preserve customization rows. Add immutable revision-level customization snapshot/versioning.

### CRIT-178-06 — HIGH

Legacy scalar migration overlaps quote and order fields. Define a backfill/reconciliation rule that preserves descriptions and avoids double counting.

### CRIT-178-07 — HIGH

Customization tax treatment must remain explicit and data-driven; the existing 18% customization behavior contradicts the issue’s composite-supply boundary.

### CRIT-178-08 — HIGH

Specify whether PI, FO, tax invoice, settlement, credit/debit notes, and receipt records reference or embed the immutable customization snapshot.

### CRIT-178-09 — HIGH

The current schema supports one product per quote/order. Decide whether REN-178 remains single-product or introduces order lines before defining Product → Customizations[] foreign keys.

### CRIT-178-10 — MEDIUM

Per-customization artwork references need validated ownership, MIME/size, URL/key allowlists, and immutable metadata snapshots.

### CRIT-178-11 — HIGH

Replacement orders currently proportionally clone the scalar customization amount; structured rows need deterministic source/version linkage.

### CRIT-178-12 — MEDIUM

Serializers, list/detail APIs, migration tests, concurrency tests, and full E2E document assertions are required.

### CRIT-178-13 — HIGH

The manual quote modal and document-chain panel still hard-code or heuristically reconstruct customization GST/amounts. They must read canonical persisted rows and approved tax-treatment metadata.

### CRIT-178-14 — MEDIUM

Snapshot/customization mismatches need explicit validation errors and observability rather than silent UI fallback recomputation.

### CRIT-178-15 — HIGH

The schema/backfill rollout needs an idempotent expand/dual-read/dual-write/contracted migration plan, dry-run reconciliation counts, and rollback compatibility for old application versions.

## Critic Attestation

Reviewer: independent fresh-context critic (`ren178_critic`); read-only: true. Categories covered: requirements/scenarios, failure/recovery, security/privacy, state/data consistency, integrations/idempotency, compatibility/migration, observability/testability, assumptions/dependencies.
