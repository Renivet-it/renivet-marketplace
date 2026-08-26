# REN-143 Engineering Contract

Status: `READY_FOR_DEV_PENDING_CRITIC`  
Final risk: `L3`  
Linear: REN-143 — Staging Hardening + Build-Trigger Optimization  
Repository context: `ayanganguly333/ren-143-staging-hardening-build-trigger-optimization`, refreshed against the current repository baseline including merged REN-115 and `src/lib/delhivery/url.ts`.

## Decision summary

REN-143 is one governance item with two independently reviewable delivery contracts:

1. [Phase A — Staging Safety / Isolation](PHASE-A-SPEC.md) changes application policy and provider boundaries. It must be implemented, reviewed, deployed to staging, and proven against the Phase A acceptance gate before Phase B starts.
2. [Phase B — Vercel Build-Trigger Optimization](PHASE-B-SPEC.md) changes deployment control only. It requires a separate change record, review, rollback, and proof.

The Linear description's branch snapshot is stale: PR #580 merged `Ayan/urgent-tasks` into both `main` and `master` at `26914e7c`. The fail-open REN-113/114 behavior and REN-116 code-side token move are therefore current baseline behavior, not changes to port. This governance contract lives on the generated REN-143 branch. Phase A implementation must use a separate branch and PR from then-current `main`; Phase B must use another branch and PR only after the live Phase A gate passes.

The owner has confirmed the Phase A environment/resource choices and selected Option A for Phase B: staging tracks `main` and uses Vercel's “Only build production” ignored-build-step behavior. Final approval still requires the independent Critic and later live Phase A evidence.

## Scope and requirements

- `REQ-001`: Non-production or ambiguous runtime identity must never authorize real external effects.
- `REQ-002`: Production effects require an explicit production identity and an explicit enabled operational policy; missing, invalid, or unreadable policy is disabled.
- `REQ-003`: Order email, WhatsApp, Delhivery, Meta CAPI, and every other mutable provider operation in the authoritative staging-journey inventory must be controlled at a server boundary; browser code must not import database-backed policy code.
- `REQ-004`: All active Delhivery paths reachable from staging journeys must use a single controlled adapter; no direct production URL or unguarded create, cancel, return, replacement, pickup, dimension-edit, tracking, or rate path may bypass policy.
- `REQ-005`: A suppressed provider call must preserve the pre-provider business state without inventing a provider-like identifier or overloading adjudication status with transport state.
- `REQ-006`: Skip and deny decisions must be observable without logging raw email addresses, phone numbers, credentials, access tokens, or full customer/provider payloads.
- `REQ-007`: Staging data stores, payment/shipping/messaging credentials, webhook registrations/secrets, cron schedules/secrets, Meta Pixel/CAPI, GA4/PostHog destinations, and Clerk test identity behavior must be verified isolated or explicitly made safe before Phase A sign-off.
- `REQ-008`: REN-113, REN-114, REN-115, and the code-side portion of REN-116 must each be reconciled and verified against their own acceptance criteria; Meta token revocation remains owned by REN-116.
- `REQ-009`: Phase B must not start until Phase A has live evidence for every required safety check.
- `REQ-010`: Phase B must leave production-project previews and production deployment behavior unchanged while making only `main` build the staging project.
- `REQ-011`: Phase A and Phase B require separate review/change records and separate rollback evidence.
- `REQ-012`: Phase B claims must report measured deployment/build outcomes and must not claim unsupported currency savings.
- `REQ-013`: A shared database must not allow a staging actor or runtime to mutate the production operational-policy row.
- `REQ-014`: The in-scope operation inventory must cover every external mutation reachable from required staging journeys, including Razorpay refunds, legacy Shiprocket cancellation, Delhivery cron/provider calls, Meta Pixel, and Clerk OTP behavior; unrelated marketing/bulk operations remain excluded.
- `REQ-015`: Production-denial recovery must follow a human-approved strategy for pre-state-mutation operations and post-commit notification/analytics effects; Phase A must not invent a generic ledger, replay system, or lossy policy without approval.
- `REQ-016`: Production denial must create an owned, deduplicated alert, and the Phase A gate must use an auditable evidence manifest tied to immutable deployments.

## Architecture

### Runtime identity and authorization

`APP_ENV` is the authoritative application identity. Only the exact value `production` can satisfy the production half of the authorization decision. `VERCEL_ENV` and `NODE_ENV` are diagnostic context only because both separate Vercel projects report `VERCEL_ENV=production` on their tracked production branch. Missing or unexpected `APP_ENV` resolves to `unknown`, which is non-production and denied.

The existing `external_side_effects` platform setting is retained only as a server-side operational kill switch. A call is authorized only when both conditions are true:

```text
APP_ENV == production
AND platform_settings.external_side_effects.value.enabled === true
```

Any missing row, malformed value, database read error, unknown environment, or non-production environment returns a typed denied decision. Phase A intentionally provides no generic non-production override. A future sandbox opt-in requires provider-specific credentials/endpoints and separate governance.

The production row and `APP_ENV=production` must be established and verified before rollout so the fail-closed code does not unintentionally suppress legitimate production behavior. Staging must explicitly use `APP_ENV=staging`; it remains denied even if it shares the production database and therefore sees the production-enabled row.

Policy mutation is production-only. The server mutation rejects unless `APP_ENV=production`, in addition to the existing `compliance_admin/manage` permission and audit event. On staging the settings surface is read-only and explains that the production switch cannot be changed there. In production the policy is permanently enabled: the switch renders locked and the server rejects any attempt to write `enabled: false`. If database isolation is proven, these restrictions still apply; a future environment-scoped non-production policy is separate governance.

### Provider enforcement

Policy is evaluated inside server-only provider façades:

- Resend order-notification actions enforce before `resend.emails.send`.
- The lowest shared WhatsApp send boundary enforces before Twilio so return/replace paths cannot bypass the order-payment wrapper.
- `sendCapiEvent` enforces before SDK initialization/use.
- All Delhivery operations route through one adapter that owns base URL resolution, credentials, method/path classification, policy, timeout, and safe denial results. Direct `fetch`/`axios` calls to Delhivery are removed from the affected graph.
- Razorpay refund and legacy Shiprocket mutation paths reached by required cancellation/return/replacement journeys either use isolated non-production credentials/data or are denied at their server boundary before provider I/O and local completion.
- Meta browser Pixel has no live-ID fallback in non-production. Clerk signup testing uses only a synthetic account and an approved owned test recipient; any unavoidable real OTP cost is recorded in Phase A evidence.
- `/api/delhivery/cron` uses the shared timing-safe cron authentication boundary, accepts only `Authorization: Bearer <secret>`, rejects URL query-string secrets, never logs credential-bearing URLs, is disabled in staging unless isolated scheduler/data/provider configuration is proven, and still passes through the controlled Delhivery and WhatsApp boundaries.

Callers consume a discriminated result such as `executed | skipped | failed`. Skipped shipment creation does not create a real-looking AWB.

The exact local representation is:

- forward-order or support-replacement shipment denial creates no `order_shipments` row and persists no AWB/provider identifier; callers and operator UI treat absence as “external fulfillment not executed” rather than success;
- return/replacement denial preserves the request's existing adjudication/workflow status and creates no `returnShipments` or exchange-provider record; suppression is returned/logged separately and never rewrites `pending`, `approved`, `rejected`, `processing`, or `completed`;
- no new application status, schema, migration, generic provider-operation ledger, or webhook inbox/outbox is authorized by this contract; if implementation evidence shows one is necessary, governance re-entry and the applicable human architectural decision are required; and
- retry/recovery behavior remains operation-specific and cannot convert a prior skip into provider execution in non-production. No synthetic AWB or provider ID is ever persisted.

### State and consistency

External authorization is checked before provider I/O. Provider credential clients initialize lazily only after authorization, so a missing credential cannot throw at module import before a safe denial. Policy read failure produces a typed denial and must not leave the calling workflow falsely marked complete. Callers distinguish:

- `skipped`: safe policy denial; continue through the documented non-production state.
- `failed`: authorized attempt reached the provider and failed; preserve existing provider-failure behavior.
- `executed`: provider accepted the operation; persist real provider identifiers only here.

The current task does not redesign provider retry or webhook idempotency. Webhook acceptance is bounded to environment ownership: the registered endpoint/secret and database must prevent staging from consuming production events or mutating production records, and outbound notifications reached from a valid staging event still pass the fail-closed provider boundary. Existing webhook ordering semantics are recorded as a separate follow-up if product owners require them changed.

Production denial recovery follows the approved operation-specific policy: order creation, shipment, and refund operations fail before important local mutation where possible and never report success or persist provider-like identifiers; email and WhatsApp effects that occur after an order commit preserve the valid order state, record the skipped notification, alert an operator, and allow authorized manual retry; analytics events are safely dropped without changing business state. No automatic retry, generic ledger, replay system, or unapproved lossy behavior is introduced.

Recovery records are operation-local and use existing durable records/logs: the order/support workflow records a redacted skipped-effect event with operation, order ID, reason, deployment/correlation ID, and retry status; an authenticated release/compliance operator manually reruns only the named email or WhatsApp action after verifying the order remains valid, and records the result/deduplication key. Shipment/refund denials have no retry record because no local completion/provider identifier is written. Analytics denials emit a redacted structured drop event only. These rules are covered by the operation-specific integration and recovery tests; no generic outbox or schema migration is permitted.

### Alerts and gate evidence

Production denial attempts a `critical` `createOperationalAlert` record and always emits an independent structured application log suitable for the configured log-alert sink. Alert persistence failure never changes denial into provider execution and never throws through a non-production skip. Required fields are environment, provider, operation, denial reason, order/business entity ID, correlation ID, deployment ID/SHA, and masked destination when applicable. Raw PII, tokens, credentials, payloads, and credential-bearing URLs are forbidden. Dedupe persistent alerts by provider/reason/deployment over a bounded window while retaining an occurrence count. The platform/release on-call owns acknowledgement and follows a runbook that verifies `APP_ENV`, policy row, database health, and the approved recovery policy; it must not bypass the gate.

Phase A produces `PHASE-A-EVIDENCE.md` in the change record after deployment. It records immutable staging and production deployment IDs/SHAs, non-secret config fingerprints, execution window, each acceptance/test expectation ID, evidence links or provider-dashboard query windows, result, operator, approver, and rollback result. Phase B eligibility requires every required item passed and a named approver.

## Security and privacy boundaries

- `SEC-001`: Vercel environment identity/configuration separates production from staging.
- `SEC-002`: Server-only policy code separates browser callers from database and secret access.
- `SEC-003`: Finance `compliance_admin` manage permission and audit log protect the kill-switch setting.
- `SEC-004`: Provider façades prevent direct production endpoint and credential use.
- `SEC-005`: Webhook secrets plus data-store ownership prevent cross-environment state mutation.
- `SEC-006`: Redacted structured logs protect customer PII and provider secrets.
- `SEC-007`: Phase A evidence gates the later deployment-topology change.
- `SEC-008`: Production-only policy mutation prevents a shared staging database from changing production authorization.
- `SEC-009`: Authenticated, environment-owned cron and webhook entry points prevent staging from processing production events or schedules.

## Investigation evidence

Investigated:

- Linear REN-143 and related REN-113/114/115/116/137, including relations and empty comment set.
- Current `main`/`master` merge `26914e7c`, PR #580 ancestry, and the merged `04dc5d8e` REN-113/114 implementation commit.
- Environment/policy helpers and their tests.
- Order creation, cancellation, return/replace, support replacement, tracking, Delhivery/Shiprocket/Razorpay mutations, WhatsApp, Resend order email, Meta Pixel/CAPI, Clerk signup, shipping webhook, Delhivery cron authentication/logging, platform-setting access/audit, and environment schema.
- Linear descriptions for REN-113/114/115/116/137 and their repository-document references; the referenced staging-readiness and infrastructure-audit documents are absent from current Git refs.
- Official Vercel Git, project-settings, environment, and deployment-configuration documentation current to 2026-08-26.

Key findings:

- `isProductionEnvironment()` falls back to `VERCEL_ENV`/`NODE_ENV`, so a separate staging project is considered production when `APP_ENV` is absent.
- `isExternalSideEffectsEnabled(false, undefined)` returns `true`; the current tests explicitly assert fail-open behavior.
- The browser-reachable payment module calls a server action whose policy is currently enforced only in the order-notification wrapper; enforcement must move to the lowest server-side WhatsApp boundary without importing database policy into browser code.
- Policy reads sit outside some local error handling and can interrupt already-partially-completed order flows.
- Delhivery has additional active cancellation, support replacement, tracking, pickup/rate, return, and WhatsApp paths beyond the five initially wrapped side effects.
- `returnReplace.ts` contains an additional active hardcoded tracking request around line 900 beyond REN-115's four named sites.
- Current skip logs omit destination context in several locations; logging full recipient values would conflict with privacy, so structured masked destinations are required.
- The referenced `docs/infrastructure-audits/2026-08-25/*` bundle is absent from inspected Git refs. Its conclusions are available only through the Linear description and cannot be treated as repository-verifiable source text.
- The existing focused tests pass, but they prove the unsafe defaults: 5 tests passed on 2026-08-26, including “defaults to enabled outside production”.

Excluded:

- Meta CAPI duration/performance (REN-138), database-pool tuning (REN-139), Redis reliability tuning (REN-140), Node 24 (REN-136), Puppeteer cleanup (REN-141), image optimization, plan changes, and branch-protection policy: no required dependency path for this contract.
- General notification/analytics redesign outside the staging journeys: provider-boundary enforcement is included, but unrelated product semantics are not.
- Application implementation, Vercel mutation, data/secret inspection, deployment, and Linear workflow changes: prohibited during SPEC.

## Approval gate

This contract becomes `READY_FOR_DEV` only after:

1. the independent L3 Critic is complete and all supported blockers are resolved or preserved as explicit blockers;
2. the production and staging `APP_ENV` rollout values and production kill-switch seed/runbook are confirmed;
3. staging database, Redis, Razorpay, Delhivery, Shiprocket, webhook, cron, Resend/Twilio, Meta Pixel/CAPI, GA4/PostHog, and Clerk test-identity facts are recorded without secrets;
4. the team confirms whether any workflow relies on staging feature-branch builds; and
5. a Vercel-supported Phase B control is demonstrated against the agreed build metric (build count/Build CPU), without claiming deployment-count reduction or changing production-project previews.

The fresh Critic's supported design findings are recorded in `CRITIQUE.md`. The contract now uses an authoritative provider inventory (including the REN-115 URL helper and residual tracking path), header-only authenticated/redacted cron behavior, preserved business state without schema changes, explicit Meta Pixel/Clerk coverage, resilient denial logging, settings-UI traceability, measured build/CPU outcomes under Option A, and the approved operation-specific production-recovery policy. Phase A still requires live evidence and a named approver.
