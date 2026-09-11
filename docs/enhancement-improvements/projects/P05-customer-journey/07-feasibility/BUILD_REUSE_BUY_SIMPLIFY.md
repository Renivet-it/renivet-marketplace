# Build / Reuse / Buy / Simplify — P05 Customer Journey & UX

## REN-144 — Build (small), don't buy
`db.transaction()` is a built-in Drizzle/Postgres capability already used elsewhere in the codebase's general patterns (not verified exhaustively, but this is standard ORM usage, not a new dependency). No third-party reconciliation product is warranted for what is fundamentally "wrap existing writes in a transaction and add a status column" — buying a payments-reconciliation SaaS product would be significant overengineering for the scope of this Epic's finding. **Simplify** is the right frame: the fix is closer to removing broken defensive code (the swallow-and-continue catch) than adding new architecture.

## REN-95 — Simplify the interim state, build the real fix later
Given REN-95 is blocked on 6 decisions, a low-cost interim simplification worth flagging to product (DECISION REQUIRED, not prescribed): make `/checkout`'s guest treatment match `/mycart`'s (show a guest view instead of an immediate hard redirect) as a stopgap that recovers some of REN-111's inconsistency without waiting on the full three-layer guest-checkout build.

## REN-152 — Reuse existing logic, don't rewrite
The consolidation target is extracting and reusing what already works in `checkout-content.tsx` (the most complete of the three implementations), not designing new checkout logic from scratch. This is real duplication removal, not a rewrite.

## REN-153 — Reuse the existing predicate
FR-3 explicitly reuses the exact filter already written for checkout; no new logic needed, only relocating/sharing it.

## REN-161 — Simplify: this may be a documentation/copy fix, not a code fix
If FR-5.1 finds the server-side rule matches the client trigger (no genuine new-customer gate), the entire remediation may be a copy change plus renaming internal constants for clarity — not a logic change. Do not build new eligibility-checking infrastructure unless FR-5.1 shows the coupon is meant to be genuinely gated and isn't.

## Anti-overengineering note
Every item in this Epic is a fix to existing, already-built functionality. There is no case here for introducing a new framework, service, or platform capability — see `11-critique/ANTI_OVERENGINEERING_REVIEW.md`.
