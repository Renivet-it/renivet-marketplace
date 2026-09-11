# REN-152 — Shared checkout business logic

## Objective

Extract checkout availability, pricing/coupon input construction, TRYNEW20 eligibility, order-guard behavior, and customization persistence into shared contracts consumed by both `/checkout` and `/mycart`, without merging their UI surfaces or changing Razorpay behavior.

## Requirements

- REQ-001: Identical cart inputs produce identical availability and price/coupon outputs in both checkout flows.
- REQ-002: TRYNEW20 constants and eligibility are defined once and consumed by both flows.
- REQ-003: Admin-order blocking state/copy/disabled behavior is exposed by one shared hook.
- REQ-004: `/checkout` persists customization requests through the existing cart mutation and refreshes canonical cart state.
- REQ-005: Buy-now and swap-reward behavior, coupon API contracts, payment-method toggling, and Razorpay wrappers remain unchanged.
- REQ-006: Order-detail-by-brand assembly is implemented once and preserves brand ordering, item fields, reward metadata, and customization values.

## Scenarios and invariants

- SCN-001: available paid cart items produce the same calculation inputs and totals in both surfaces.
- SCN-002: unavailable, unselected, deleted, unpublished, inactive, unapproved, or out-of-stock items are excluded consistently.
- SCN-003: reward items preserve zero paid price and reward-value discount semantics.
- SCN-004: TRYNEW20 applies/removes under the same threshold rule in both surfaces.
- SCN-005: customization saves on blur, trims to 500 characters, clears with `null`, reports failure without replacing canonical data, serializes writes per item while coalescing queued edits to the latest value, survives refetch/abandonment, and disables navigation/payment while pending. After each successful queue drain it refetches canonical state, so an older request cannot complete after and overwrite a newer value.
- SCN-006: blocked operator accounts receive the same stable guard copy and disabled behavior while server authorization remains authoritative.
- SCN-007: shared order-detail-by-brand assembly preserves current ordering and item payloads.
- SCN-008: ordinary cart, buy-now, reward-only, and mixed reward/paid sources retain their current selection, quantity, identifier, ordering, and reward-value semantics before entering shared pricing.
- SCN-009: an eligible TRYNEW20 result never replaces a manually entered coupon.
- SCN-010: a rejected TRYNEW20 validation may be retried when eligibility is evaluated again.
- SCN-011: a stale TRYNEW20 validation completion cannot overwrite newer coupon or cart state.
- INV-001: no payment, order creation, tax, coupon-validation, or Razorpay contract changes.
- INV-002: shared helpers are pure and deterministic; hooks own UI/mutation effects only.
- INV-003: both existing entry routes remain available.
- INV-004: server-side order authorization remains authoritative and is not replaced by the client guard hook.

## Architecture

- `src/lib/checkout/shared.ts`: pure availability, item normalization, coupon inputs, total calculation wrapper, and auto-coupon policy.
- `src/lib/hooks/use-customer-order-guard.ts`: accepts the already-fetched account plus loading state and returns stable banner/toast copy and one disabled predicate. Server authorization remains authoritative; loading/error states fail closed in the UI.
- Existing cart `updateCustomizationRequest` mutation remains the sole persistence path. `/checkout` saves on blur, treats empty text as `null`, and runs at most one mutation per cart item at a time. A blur during an in-flight write replaces that item's queued value; the latest queued value runs only after the active write settles. The UI remains pending until the per-item queue drains, reports failures while retaining the queued/local value for retry, and refetches canonical cart state after the final successful write.
- Shared normalization accepts typed paid cart items plus optional route-owned buy-now/reward selections. Buy-now quantity parsing and reward selection remain route-owned; the helper preserves paid-item order and prepends/appends reward items exactly as each existing route does.
- TRYNEW20 uses strict paid subtotal `> 3000 * 100`, never replaces a manually applied coupon, clears only TRYNEW20 at/below threshold, retries after validation rejection, and ignores stale async validation results.
- Shared order-detail assembly groups by brand without reordering first-seen brands/items and preserves every existing item field.
- Both checkout surfaces consume shared contracts; no new schema or API is introduced.

## Verification

- Unit tests prove identical outputs for equivalent inputs and cover availability/reward/coupon boundaries.
- Static regression assertions verify all three checkout components import the shared contracts.
- Component tests cover blur save, pending disabled state, success/refetch, clear, failure/retry, and out-of-order user edits while a mutation is in flight, proving per-item serialization and final canonical refetch.
- Full `bun test`, governance validation, and post-implementation review.

## Exclusions

No route merge, new checkout features, Razorpay wrapper changes, schema migrations, or REN-133/REN-144 work.
