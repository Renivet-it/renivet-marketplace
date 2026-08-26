# REN-143 Phase A — Staging Safety / Isolation

## Delivery boundary

Phase A is an application/configuration safety change. PR #580 has already merged the relevant `Ayan/urgent-tasks` work into `main` and `master`, so Phase A must correct the merged baseline in place. It must use its own implementation branch and PR from then-current `main`; the REN-143 governance branch and Phase B branch are not the Phase A implementation diff.

## Required implementation sequence

1. Record the authoritative operation and non-secret environment inventory for both Vercel projects: `APP_ENV` value/presence; distinct-or-shared database/Redis fingerprints; Razorpay, Delhivery, Shiprocket, Resend, Twilio, Meta, GA4, PostHog, and Clerk identities; webhook destinations; and cron schedules/secrets. Exclude unrelated bulk marketing operations explicitly.
2. Pre-provision explicit `APP_ENV=production` and the enabled production kill-switch value. Confirm staging has `APP_ENV=staging`. Do not deploy the code until rollback and verification owners are named.
3. Replace fallback environment inference with exact, fail-closed application identity.
4. Replace the boolean policy with a server-only typed decision. Missing/malformed/unreadable settings deny and emit a redacted operational event.
5. Move enforcement into server provider façades. Keep browser code free of database policy imports, and initialize provider clients/credentials lazily only after authorization.
6. Make the policy-setting mutation production-only at the server boundary; staging is read-only even with a shared database.
7. Route every active Delhivery path in the investigated journey graph through the controlled adapter, including the named REN-115 sites and the additional tracking/cancellation/replacement paths.
8. Make forward, return, replacement, and support-replacement callers handle `skipped`, `failed`, and `executed` explicitly. A skip creates no provider row/identifier and preserves existing business/adjudication state. This contract authorizes no schema or status migration.
9. Put Razorpay refund and legacy Shiprocket mutations reached by required cancellation/return journeys behind proven isolated test credentials/data or the same fail-closed server authorization boundary.
10. Secure `/api/delhivery/cron` with shared timing-safe cron authentication that accepts only `Authorization: Bearer <secret>` and rejects URL query-string secrets, staging-disable/isolation behavior, controlled provider calls, and credential-safe logs. Webhook scope is environment ownership and outbound gating, not a replay/idempotency redesign.
11. Remove the live Meta Pixel fallback outside production and define the bounded synthetic Clerk OTP test recipient/cost evidence.
12. Update the settings UI copy/default to fail closed and retain permission/audit controls. Do not expose an unqualified staging enable switch.
13. Implement the approved operation-specific production-denial recovery: pre-mutation order/shipment/refund denial leaves no completion/provider identifier; post-commit email/WhatsApp skips are recorded in existing order/support records and manually retryable by an authenticated operator; analytics skips are redacted drop events. Do not introduce a generic ledger/outbox or unapproved lossy behavior.
14. Add unit, component/server-action, API/integration, security, accessibility, UI, and regression coverage described by the machine contract.
15. Deploy to staging first and execute the live acceptance matrix. Produce `PHASE-A-EVIDENCE.md`, promote only through the confirmed `main`/`master` flow, then prove production behavior with a controlled real order.

## Acceptance matrix

| Case | Expected |
|---|---|
| Missing `APP_ENV` | All controlled provider calls denied; structured reason `unknown_environment` |
| `APP_ENV=staging`, missing/malformed/true shared DB setting | All real provider calls denied |
| Policy database read failure | Provider call denied; alert-write failure cannot reverse denial; caller follows the approved production-recovery policy |
| Staging user with compliance-admin manage permission and shared DB | Policy write rejected; production row unchanged; audited denial |
| Production, missing/false setting | Denied and operational alert emitted |
| Production, explicit identity and true setting | Existing real provider behavior preserved |
| COD staging order | Internal order created; no real Resend, Twilio, Delhivery, or Meta CAPI effect |
| Delhivery create/return/replace/cancel/pickup/edit/track/rate path in staging | No request to production Delhivery; safe typed result |
| Cancellation/return with Razorpay or legacy Shiprocket path | Isolated test credential/data is proven or provider mutation is denied before local completion |
| Retry after skipped call | Still no provider effect and no duplicate/local corruption |
| Forward shipment skipped | No shipment/provider row or identifier; internal order remains valid and UI reports not externally fulfilled |
| Return/replacement skipped | Existing request adjudication status is unchanged; no provider shipment row/identifier |
| Provider outage while staging is denied | No request attempted; behavior identical to ordinary denial |
| Authorized provider outage | Existing failure state, alerts, and retry/idempotency behavior preserved |
| Shipping webhook with wrong/environment-mismatched secret | Rejected before data mutation or notification; staging cannot consume production events |
| Delhivery cron with missing/wrong/shared secret | Rejected before data/provider mutation; staging is disabled unless scheduler, data, and providers are isolated |
| Analytics | CAPI and live Meta Pixel denied; GA4/PostHog use distinct non-production destinations or are disabled |
| Clerk signup | Synthetic account plus approved owned OTP recipient only; unavoidable real-provider cost is recorded |
| Logs | Include provider, operation, environment, reason, correlation/order ID, and masked destination; no raw PII/secrets/payload or credential-bearing URL |

## Related-issue reconciliation

| Issue | Applicable acceptance | Evidence contract | Ownership/exclusion |
|---|---|---|---|
| REN-113 | Separate Vercel staging is not production; missing/invalid identity denies | `TEXP-001`, staging/production config fingerprint and truth-table results | Phase A owns code and deployed identity proof |
| REN-114 | Five named effects are skipped/logged in non-production and production behavior remains | `TEXP-002`, `TEXP-004`, `TEXP-007`, `TEXP-008` mapped to each email/WhatsApp/Delhivery/CAPI operation | Phase A broadens enforcement to provider boundaries |
| REN-115 | Four named hardcoded Delhivery sites respect controlled routing and cannot bypass; additional active tracking path is included | `TEXP-005`, `TEXP-006`, call-graph scan and adapter request-spy evidence | Phase A owns all active affected paths, not commented examples |
| REN-116 | CAPI token is read from typed server environment and no source literal remains | Existing `src/lib/fb-capi.test.ts` plus secret scan; live old-token revocation evidence referenced in `PHASE-A-EVIDENCE.md` | Token regeneration/revocation remains REN-116's human-owned action and blocks live sign-off, not duplicated implementation |

## Alert and evidence operations

Production denial attempts a critical persistent operational alert owned by platform/release on-call and always emits an independent structured log for the configured log-alert sink. Alert persistence failure never enables the provider call. Dedupe persistent alerts by provider/reason/deployment with occurrence counts. The acknowledgement runbook verifies application identity, policy row, database health, recent deployment, and the approved operation-specific recovery policy before any retry.

`PHASE-A-EVIDENCE.md` must include immutable deployment IDs/SHAs, non-secret resource fingerprints, test expectation IDs, timestamps, evidence links/query windows, results, operator, approver, and rollback verification. Phase B cannot rely on screenshots or prose that cannot be tied to the deployed SHA.

## Rollback

Rollback is forward-safe, not a blind revert to the ungated base:

1. Keep explicit `APP_ENV` values and the kill switch in a denied state during rollback.
2. Revert only the Phase A application commits.
3. If a code rollback would restore fail-open behavior, first disable provider credentials/routes or deploy the smallest prior fail-closed revision.
4. Re-run missing configuration, COD order, and provider-dashboard absence checks.
5. Record who verified Resend, Twilio, Delhivery, Meta, webhook, cron, database, and Redis outcomes.

Phase A is complete only when live evidence is attached to the change record. Code review and unit tests alone do not unlock Phase B.
