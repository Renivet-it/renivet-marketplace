# REN-152 Critique

## Review history

The initial independent review identified and resolved these findings:

- `CRIT-001` (state/data consistency): the customization save lifecycle did not define its trigger, normalization, failure recovery, stale completion handling, or canonical refresh. Resolved by specifying `onBlur`, trim/max-length/null normalization, pending blocking, visible errors, stale-result suppression, retry, and post-success refetch.
- `CRIT-002` (requirements/scenarios): route-specific buy-now and reward normalization was ambiguous. Resolved by defining typed ordinary, buy-now, reward-only, and mixed inputs while preserving route-owned quantity, selection, identifier, order, and reward semantics in `SCN-008`.
- `CRIT-003` (requirements/scenarios): shared order-detail-by-brand assembly was missing. Resolved with `REQ-006`, `SCN-007`, `FLOW-003`, and `TEXP-006`, including stable first-seen ordering and complete payload preservation.
- `CRIT-004` (failure/recovery): TRYNEW20 threshold, manual-coupon protection, rejection retry, and async race behavior were underspecified. Resolved by defining the strict paid-subtotal threshold, selective clearing, manual-coupon preservation, retry, and stale-result suppression.
- `CRIT-005` (security/privacy): the shared guard interface and authorization boundary were unclear. Resolved by defining an already-fetched-account/loading hook contract and `INV-004`, which keeps server-side authorization authoritative.
- `CRIT-006` (observability/testability): customization persistence lacked sufficient lifecycle coverage. Resolved with required component coverage in `TEXP-005` for blur, pending, success/refetch, clear, failure/retry, stale completion, and remount recovery.
- `CRIT-007` (integrations/idempotency): mutation/coupon integrations and related REN-144 coordination were missing. Resolved by inventorying `INT-001` and `INT-002` and explicitly excluding REN-144 from this change.

A second review identified and resolved these traceability findings:

- `CRIT-008` (requirements/scenarios): scenario identifiers in `SPEC.md` and `work-item.yaml` disagreed. Resolved by aligning `SCN-005` through `SCN-008` across both artifacts.
- `CRIT-009` (security/privacy): `INV-004`, which keeps server authorization authoritative, was not traced. Resolved by tracing it to `SCN-006`.
- `CRIT-010` (observability/testability): `TEXP-005`, the customization persistence lifecycle test, was not linked. Resolved by linking it to `SCN-005`.

A final fresh-context review found the substantive contract sound but identified two audit blockers:

- `CRIT-011` (assumptions/dependencies): the dispositions of `CRIT-008` through `CRIT-010` were not retained in this artifact. Resolved by recording them above.
- `CRIT-012` (failure/recovery): manual-coupon preservation, validation retry, and stale validation suppression for `TRYNEW20` existed only in prose. Resolved by adding authoritative scenarios `SCN-009` through `SCN-011` and linking them to required regression coverage.

A subsequent concurrency and traceability review identified and resolved:

- `CRIT-013` (`DESIGN_BLOCKER`; state/data consistency and integrations/idempotency): suppressing stale client completions did not prevent an older concurrent mutation from overwriting newer server state. Resolved by requiring one active write per item, latest-value queue coalescing, pending state until queue drain, retryable failure handling, and canonical refetch only after the final successful write; `SCN-005` and `TEXP-005` cover the ordering contract.
- `CRIT-014` (`MAJOR`; security/privacy and traceability): `INV-004` existed only in YAML. Resolved by adding the same authoritative server-authorization boundary to `SPEC.md`.

## Final outcome

An independent fresh-context critic reviewed all eight required categories, the complete `CRIT-001` through `CRIT-014` audit trail, all IDs and traceability, and the serialized/coalesced customization-write contract. The result was `APPROVED` with no remaining findings.
