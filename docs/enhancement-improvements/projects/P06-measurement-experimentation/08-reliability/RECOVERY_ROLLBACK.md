# Recovery / Rollback — P06

## Rollback safety
Every proposed V1 fix (REN-145, 131, 132 doc-only, 133, 134) is a standard application-code change deployed through the normal path — rollback is a standard git revert / redeploy, no data migration, no schema change, no irreversible external-system state change. Meta/PostHog do not need to be "rolled back" — once a corrected event is sent, no un-sending of prior bad events is possible or required (see below).

## No backfill of historical bad data
This Epic's fixes are forward-looking (correct future events). Per the explicit ROI/economics-fabrication prohibition, no attempt should be made to retroactively "correct" historically-sent Meta Purchase values or re-derive true historical ad performance from the defective data — that data's true values are unrecoverable to certainty (PROBABLE-not-CONFIRMED magnitude, per REN-145's classification). Any retroactive analysis should be flagged as an estimate with the same PROBABLE caveat, not presented as corrected fact.

## Recovery if a fix introduces a new defect
Given NFR-2 (idempotency), the main new-defect risk is REN-131's server-side capture accidentally double-counting alongside the existing client-side capture if not coordinated with REN-133. Recovery path: the existing `eventId`-based dedup mechanism (already proven for Pixel/CAPI) should be extended to also gate PostHog capture if both client and server paths remain active — if this is not done and double-counting is discovered post-deploy, rollback the server-side capture addition (isolated code path, safe to revert independently) while the currency/fan-out fixes remain in place.

## Feature-flag safety net
`shouldRunExternalSideEffects()` already provides a kill switch for all CAPI-bound side effects — no new kill switch is required, but any new server-side PostHog capture path (REN-131) should be checked for whether it should also respect this or an equivalent gate for non-prod safety.
