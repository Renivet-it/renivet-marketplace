# REN-133 Independent Critique

Reviewer: Carson (fresh-context independent critic)
Mode: read-only; reviewed the Linear context, repository evidence, and `SPEC.md` only.

## Review result

`READY_FOR_OWNER_APPROVAL`

The Linear description predates the current repository state: `purchase_completed` is already centralized server-side. The approved design resolves that mismatch by preserving the server source of truth and consolidating only the duplicated browser Meta instrumentation.

## Findings and dispositions

- `CRIT-133-001` — MAJOR — `REQ-133-001`, `DEC-133-001`: The issue describes duplicate `purchase_completed` capture, but repository evidence shows `capturePurchaseCompleted` is already centralized in the order mutation. Resolve the scope as browser Meta Pixel/CAPI consolidation only, with server PostHog explicitly unchanged.
- `CRIT-133-002` — MAJOR — `REQ-133-002`, `SCN-133-002`: The two checkout paths have different item-state names and multiple completion branches. Resolve the typed adapter contract and prove all existing invocation points retain their current order IDs, totals, and item quantities.
- `CRIT-133-003` — MINOR — `REQ-133-003`, `INV-133-002`: Pixel and CAPI must retain the same event ID even when one transport fails. Test both synchronous Pixel failure and asynchronous CAPI rejection without changing the checkout result.
- `CRIT-133-004` — MINOR — `REQ-133-004`, `INV-133-003`: Do not add retries or deduplication state during a consolidation task; repeated callbacks and server/client event ownership must remain observable and unchanged.
- `CRIT-133-005` — MINOR — `SEC-133-001`, `TEXP-133-001`: Existing matching fields include customer contact/address data. Preserve the established action boundary and do not expand or log those fields in the new helper.

## Approval gate

All Critic findings are incorporated into the contract. The owner explicitly approved the scope and callback-preservation decisions; no design blocker remains.
