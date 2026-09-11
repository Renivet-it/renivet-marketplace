# P06 — Measurement & Experimentation — Implementation Reconciliation

The only Epic with real, evidence-worthy activity to reconcile. Source: PR #597 (`ayanganguly333/ren-129-130-131-132`), merged into `origin/master` at `4943c40a` on 2026-08-28 03:10:54, ~3.5 hours after the SRS baseline.

## Reconciliation matrix

| Item | Linear | SRS requirement | Current code | Status | Gap | Risk |
|---|---|---|---|---|---|---|
| REN-129 (PostHog init delay) | REN-129 | Reduce/reassess the 5s delay | `posthog-init-policy.ts` — `POSTHOG_INIT_DELAY_MS = 1500` (5000ms → 1500ms), real code, full SPEC→REVIEW→CRITIQUE cycle | **MATCH** | None found | Low — reduced, not eliminated; matches "reassess," not "eliminate," which is what was asked |
| REN-130 (phone-first auth tracking) | REN-130 | Add PostHog tracking to phone sign-up/sign-in | `auth-analytics.ts` (new), `phone-first-sign-in.tsx`, `phone-first-sign-up.tsx`, `sso-callback/page.tsx` all modified; null-safe, try/catch-guarded capture calls; real tests (`auth-analytics.test.ts`, `client.test.ts`) | **MATCH** | None found | Low — implementation is small and defensively written |
| REN-131 (server-side purchase capture) | REN-131 | Add server-side `purchase_completed` capture (SRS: coordinate with REN-133's dedup) | `work-item.yaml` **state: APPROVED**, no `REVIEW.md`, **zero application code** implementing capture | **PARTIAL** (contract only) | Full code implementation still missing | **See cross-project finding below — real, not yet acted on** |
| REN-132 (add_to_cart/cart_added reconciliation) | REN-132 | Reconcile the 4.3x discrepancy | `work-item.yaml` **state: APPROVED**, no `REVIEW.md`, **zero application code** | **PARTIAL** (contract only) | Full code implementation still missing | None new |
| REN-133 (dedup coordination) | REN-133 | Coordinate with REN-131 per P06 SRS's self-identified risk | **No work-item exists for REN-133 at all** | **MISSING** | No contract, no code | See cross-project finding — REN-131's contract addressed the underlying dedup question independently, without ever citing REN-133 by ID |
| REN-134 (client.tsx rename) | REN-134 | Rename the misleadingly-named server-side client | No work-item, no code change to the file's name | **MISSING** | Full implementation | None new — hygiene only |

## Section 8 checks, answered directly — could this implementation cause duplicate events?

**No duplicate-event risk exists yet, because REN-131 has zero code.** But the APPROVED contract itself is worth scrutinizing now, before code is written:

- `REN-131/work-item.yaml` DEC (decision) block: *"Should a multi-brand checkout emit one purchase event, one event per persisted brand order, or another deduplicated business unit? Recommendation: emit one `purchase_completed` event per complete checkout using a stable checkout/order-group identifier for deduplication, rather than one event per brand-split order."* This recommendation, if implemented as approved, **would resolve** the per-brand-fan-out duplication risk the P06 SRS package worried about — provided it's actually built this way.
- **However, REN-131's contract never references REN-133 by ID anywhere** (confirmed by direct grep — zero matches). It independently arrived at a similar-spirited answer (deduplicate via a stable identifier) without the explicit cross-ticket coordination the P06 SRS package called for. This is a process gap, not (yet) a code defect: the *right answer* may already be written into REN-131's contract, but it was still written in isolation from the ticket whose entire purpose was this exact coordination.
- **A separate, more material finding:** REN-131's `DEP-131-001` ("order persistence and transaction semantics") is marked **`status: resolved`** — but its own description reads *"The current route creates per-item orders within a larger mutation and has external side effects,"* i.e., it explicitly acknowledges the exact fragile, non-transactional order-creation path that **P05's REN-144 (still fully unimplemented, see `P05_RECONCILIATION.md`)** exists to fix — and marks it "resolved" on the basis of the dependency being *understood*, not *fixed*. If REN-131 is implemented before REN-144 ships, server-side purchase-event capture will be built to treat "order persisted" as the authoritative success signal, using the exact same signal P05's own SRS says is currently unreliable (can be partial/silently incomplete). This is the single most important cross-Epic finding in this whole reconciliation — see `CROSS_PROJECT_RECONCILIATION.md`.

## Test check

REN-129/130 (shipped): real tests exist (`auth-analytics.test.ts`, `client.test.ts`) — not evaluated for completeness in depth here, but their existence is itself consistent with the governance system's REVIEW gate. REN-131/132: no code, so no tests exist or are expected yet.

## Final decision per item

- REN-129: **KEEP.**
- REN-130: **KEEP.**
- REN-131: **VERIFY before implementation proceeds** — specifically, confirm (a) the eventual implementation actually builds the one-event-per-checkout dedup design already in its own approved contract, and (b) whether it should wait for REN-144, or ship with an explicit, documented caveat that its "order persisted" signal inherits REN-144's known unreliability until that ships. This is a sequencing decision, not a code defect — recommend **DEFER implementation start until this sequencing question is explicitly answered by whoever owns both tickets.**
- REN-132: **VERIFY** dependency claims once implementation starts; no blocking issue found in the contract itself.
- REN-133: **MISSING entirely** — recommend creating this coordination explicitly (or formally folding its intent into REN-131's contract, since REN-131 already addresses the same question) rather than leaving it as a phantom reference with no work-item.
- REN-134: **DEFER** — hygiene-only, no urgency.
