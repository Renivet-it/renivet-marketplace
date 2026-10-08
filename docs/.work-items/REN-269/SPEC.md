# REN-269 Specification

Separate payable, statement-issued, payout-approved, and payout-executed/reconciled states. Payability requires delivered status, full customer payment, accepted brand invoice, and GRN where warehouse mode applies. Amounts come from authoritative FO/commercial data and accepted invoice; corrections are versioned.

Acceptance: invalid or incomplete orders cannot become payable; one current obligation exists per order/brand; issuance does not imply approval; execution boundary is explicit and idempotent; tax deductions follow confirmed Finance/CA policy.
