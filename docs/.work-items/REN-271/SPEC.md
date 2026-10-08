# REN-271 Specification

Make the Fulfilment Order one immutable, versioned production snapshot containing product/SKU, quantities, allocations, artwork/customization, tax, delivery, payment terms, and authoritative total. Add guarded Corporate status transitions with payment/credit gates, current-version QC maker-checker, direct/warehouse prerequisites, and recoverable failures.

Acceptance: factory can fulfil from the FO alone; PDF equals persisted snapshot; unpaid orders cannot enter production except explicit auditable exception; invalid status/QC/terminal transitions fail closed; customization never disappears.
