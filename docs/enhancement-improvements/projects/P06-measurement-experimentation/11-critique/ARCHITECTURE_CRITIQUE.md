# Architecture Critique — P06

## Real weakness: no shared commerce-event abstraction
Every commerce event is hand-fanned-out to PostHog + Pixel + CAPI at each call site, independently. This is the structural reason REN-133's duplication exists and why REN-145's fix must be applied in two files rather than one. It's a legitimate long-term weakness — but see `07-feasibility/BUILD_REUSE_BUY_SIMPLIFY.md` for why fixing it now, as part of a P0-urgent bug fix, is the wrong sequencing.

## Real weakness: checkout logic itself is duplicated, not just the analytics on top of it
`buildOrderDetailsByBrand()` exists as two independent implementations. The analytics duplication (REN-133) is a symptom of a deeper duplication (two checkout entry points with parallel logic) that is P05's architectural concern, not P06's to fix — but P06's fix should be designed with awareness that this duplication will likely persist and any consolidation approach needs to work in both files (or coordinate with P05 to consolidate the checkout logic itself, which is a bigger, cross-Epic conversation).

## Real weakness: no shared identity/session layer across PostHog and Meta
Attribution reconciliation across PostHog and Meta is currently a manual, human, dashboard-comparison exercise — there's no engineered link between a PostHog distinct ID and a Meta `external_id`/`fbp`/`fbc` beyond both independently deriving from the same Clerk user where available. This is normal for a two-vendor analytics setup and not a defect, but it does mean the 11/15/2/0 reconciliation gap can never be fully closed by an engineering fix alone — some gap is structurally permanent given three independently-operated measurement systems.

## What is NOT a weakness
The fire-and-forget, non-blocking pattern for all analytics calls (`.catch()` rather than `await`-blocking checkout) is correctly designed and should not be "fixed" — flagging this explicitly so it isn't misread as an oversight during implementation of the REN-145/131 fixes.
