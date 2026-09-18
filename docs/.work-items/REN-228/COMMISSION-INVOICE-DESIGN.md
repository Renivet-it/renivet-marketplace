# REN-228 Track B — Regular-Order Commission-Invoice Plumbing Boundary

## Purpose

Define the implementation boundary for a future regular-order commission invoice without deciding tax treatment.

## Proposed mechanism

- Source: the finalized payout-cycle line items and approved commission rule used by the regular payout statement.
- Trigger: only after the payout cycle reaches the approved execution path; generation must be idempotent for the same cycle/brand/order scope.
- Reference: persist a document reference and download location alongside the payout/statement control record when the mechanism is implemented. Reuse REN-225's canonical invoice-number service; do not create a second allocator.
- Access: finance administrators and the applicable seller/brand account only, using the same authorization boundary as payout statements.
- Audit: record issuer, generated timestamp, source cycle, source line items, version/supersession, and any regeneration reason.

## Explicitly deferred

CA/Registerkaro must decide whether this is a tax invoice, commercial invoice, debit note, or another document; the numbering format; GSTIN/HSN/SAC fields; tax rates; place-of-supply treatment; and statutory wording. No code in this task may assume those answers.

## Completion boundary

This is a design/plumbing contract only until the external tax/document conclusion is attached to REN-228. Track B is not considered tax-document implementation complete before that conclusion.

