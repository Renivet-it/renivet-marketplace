# REN-265 Specification

Make Corporate quote lifecycle, revision, PO, ownership, scope, quantity, employee, size allocation, and one-order rules explicit and race-safe. Approved commercial versions are immutable; material changes require a new approved revision.

Acceptance: expired/rejected/draft or cross-company quotes cannot create orders; PO scope and allocations match the approved quote; numbering and one-order-per-approved-quote are DB/transaction safe; downstream records reference the approved version.
