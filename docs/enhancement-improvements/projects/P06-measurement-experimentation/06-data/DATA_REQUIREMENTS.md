# Data Requirements — P06

- Meta-bound `value` fields (Pixel + CAPI) MUST be rupee-denominated decimals, consistent with `CapiCustomData.value?: number` type already declared in `src/lib/fb-capi.ts`.
- Purchase-completion payloads MUST carry a checkout-level identifier (not only per-brand order IDs) so that a future consolidation (FR-2) has a natural key to group on.
- `capiLogs` schema already captures `eventName`, `eventId`, `userData`, `customData`, `status`, `response` — sufficient for post-fix auditing; no schema change required.
- No new PII fields are required by any V1 fix.
