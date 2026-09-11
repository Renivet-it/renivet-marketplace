# Security — P06

## PII handling (already correct, verify preserved)
`sendCapiEvent` sanitizes user data via `sanitizeFbUserData()` before constructing Meta's `UserData` object (email/phone/name hashing is handled by Meta's SDK per its standard CAPI contract). No plaintext PII is logged beyond what's already stored in `capiLogs.userData` (a pre-existing design choice, not something this Epic's fixes should change or expand).

## Access control
The CAPI logs dashboard (`src/app/(protected)/dashboard/capi-logs/page.tsx`) is under `(protected)/dashboard`, consistent with the rest of the internal dashboard's auth gating — no new access-control surface is introduced by any V1 fix.

## Secrets
`FACEBOOK_CAPI_ACCESS_TOKEN` and PostHog keys are already sourced from `env.ts` / environment variables, not hardcoded (aside from the pre-existing hardcoded Pixel-ID fallback noted in `04-architecture/INTEGRATIONS.md`, which is a public Pixel ID, not a secret, and out of this Epic's fix scope). No credential handling changes are required by any V1 item.

## No new attack surface
None of REN-131/132/133/134/145's fixes introduce new user input handling, new endpoints, or new external calls beyond what already exists — the CAPI/Pixel/PostHog integrations are pre-existing; the fixes change *when* and *what value* is sent, not *who* can trigger them or *what new data* is collected.

## Not applicable
No authentication, authorization, encryption, or injection-surface changes are in scope for this Epic.
