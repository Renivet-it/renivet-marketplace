# Critique — REN-236

## Independent review

The latest Linear contract and current repository paths were reviewed read-only. The design is implementable without schema changes.

### CRIT-236-001 — MINOR

The existing payout calculation must identify RTO using the order's shipment/disposition relationship without relying on customer return rows. The implementation should keep this lookup explicit and cover no-disposition behavior so future payout changes cannot silently default to brand chargeability.

### CRIT-236-002 — MINOR

The same outcome description must be carried by the shared line item consumed by both the PDF statement and admin table; separate display-only inference would risk divergence.

No design blockers remain. REN-237 is implemented on this branch and provides the authoritative `faultOwner` producer.
