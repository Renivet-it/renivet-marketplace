# Non-Functional Requirements — P06

## NFR-1: No measurement pipeline may block or slow the checkout critical path
Analytics/CAPI calls are already fire-and-forget (`.catch(err => console.error(...))` pattern observed in both checkout files) — any fix must preserve this. A purchase must be able to complete even if PostHog/Meta/GA4 are down or slow.

## NFR-2: Idempotency / exactly-once intent for conversion events
Meta CAPI events already carry a client-generated `eventId` used for Meta's own deduplication between Pixel and CAPI. Any consolidation (FR-2, FR-3, FR-4) MUST preserve or extend this dedup mechanism — introducing a second (e.g., server-side) purchase-capture path without a shared event ID risks creating a new double-counting defect while fixing the fan-out one.

## NFR-3: No PII/CAPI data expansion beyond current scope
`sendCapiEvent` already sanitizes user data via `sanitizeFbUserData`. Any fix to REN-145/131/133 MUST NOT add new PII fields to the Meta-bound payload beyond what's already sent (email/phone/name/address hashing is Meta SDK's responsibility, not this Epic's).

## NFR-4: Backward-compatible event schema
Existing PostHog event names/properties (`cart_added`, `add_to_cart`, `purchase_completed`) MUST NOT be silently renamed or restructured in a way that breaks existing PostHog dashboards/insights/funnels built against them, unless the dashboard is updated in the same change. (REN-134's rename is file/module-level, not the PostHog event-name level, and is unaffected by this.)

## NFR-5: Auditability
CAPI events are already logged to `capiLogs` (`src/lib/db/schema/capi-logs.ts`) regardless of success/failure. Any fix MUST preserve this audit trail so that a future reconciliation pass (e.g., re-checking whether the currency fix actually resolved the historical-magnitude PROBABLE claim) has real data to work from.

## NFR-6: Feature-flag/kill-switch already exists — reuse it
`shouldRunExternalSideEffects()` already gates whether CAPI events fire at all (used for non-prod environments). Any fix should be testable behind this existing gate rather than introducing a new one.
