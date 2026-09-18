# REN-209 — Brand Commercial Configuration Control

## Status

`BLOCKED` pending authoritative commercial-term approval.

## Contract boundary

This task may create an admin-only, effective-dated configuration surface backed by the existing `commission_rules` source of truth and the REN-208 agreement-version repository. It must not invent, default, migrate, or activate commercial values for brands without documentary authority. Unconfigured brands must remain visibly unconfigured and produce no payable commission.

## Required behavior

- Admins can view and maintain brand-scoped commission rules and associated non-rate metadata.
- Every populated term cites a REN-208 agreement version or is explicitly marked as having no source document on file.
- The payout resolver uses the order delivery date and existing rule-priority behavior.
- Missing approved configuration is fail-closed: no generic 18%/20% fallback.
- Holdback remains inactive while BIZ-15 is suspended.
- Payment Fee remains an empty field until BIZ-14 formula extraction is decided.
- Brand users cannot read or write this admin surface.
- Changes are audit logged with actor, timestamp, before/after, and agreement reference.

## Blocking decision

Terra Luna’s 25% / 20% terms are financial production configuration. Before implementation can be approved, the user must provide or confirm:

1. The exact authoritative agreement version ID from REN-208.
2. The named internal approver whose approval is recorded.
3. Confirmation that the 25% commission and 20% Personal Care value are provisional, and the exact commission basis for each value.

Until those inputs exist, no migration, seed, or runtime write may populate Terra Luna or any other brand.

## Explicit exclusions

No Payment Fee formula, no active holdback, no “including delivery” interpretation, no `contract_signed_at` or `contract_expires_at` writes, no payout execution, and no brand-facing commercial-terms surface.

## Evidence inspected

- `src/lib/db/schema/finance-compliance.ts`: `commission_rules` already stores brand/category/product-type scope, bps rates, holdback bps, priority, effective dates, and metadata.
- `src/lib/finance/payouts.ts`: `resolveCommissionRuleForItem()` consumes effective-dated rules and returns no rule when none matches.
- `docs/.work-items/REN-208/`: agreement repository is available as the planned source-document reference.
- Linear REN-209: BIZ-13 is Terra Luna-only and provisional; BIZ-14, BIZ-15, BIZ-16 remain constrained as described above.
