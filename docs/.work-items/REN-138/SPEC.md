# REN-138 Engineering Contract

Status: `IN_REVIEW`  
Final risk: `L2`  
Linear: REN-138 — CAPI Execution Path Optimization  
Branch: `ayanganguly333/ren-138-capi-execution-path-optimization`

## Decision summary

Bound the Meta Graph API attempt and every CAPI-log database operation, make the Meta attempt and initial log persistence independent with `Promise.allSettled`, and register the product-page ViewContent work with Next.js `after()`. The Meta SDK's supported custom HTTP-service seam will use `fetch` plus `AbortController`, so the deadline cancels the underlying request rather than only racing the caller. The work remains telemetry-only: no customer response, order state, payment state, shipment state, database schema, retry queue, or generic worker architecture changes.

The existing log status is derived from the Meta outcome and the existing dashboard treats non-`success` values as failed. Therefore, truly concurrent initial operations require a transient `pending` log followed by a bounded update to `success` or `failed`. If the initial insert or terminal update cannot be completed, the Meta outcome still returns/logs independently and no false terminal status is written. The implementation must make the pending state visible as unknown/in-progress in the CAPI log UI rather than rendering it as a confirmed failure.

## Scope and requirements

- `REQ-001`: `sendCapiEvent` must enforce a finite timeout for the authorized Meta Graph API attempt and cancel the underlying request when that deadline is reached.
- `REQ-002`: Each CAPI-log database operation must have its own finite deadline and supported Postgres.js cancellation attempt; it must not extend the Meta attempt, and cancellation must not be reported as confirmed through an unavailable promise.
- `REQ-003`: The Meta attempt and initial CAPI-log persistence must be started independently and collected with `Promise.allSettled`; one result must not short-circuit, reject, or serialize the other.
- `REQ-004`: Logs must retain truthful delivery state: accepted Meta requests are `success`, provider rejection, timeout, transport error, or invalid response are `failed` with typed outcome details, and incomplete two-phase persistence is `pending`/unknown rather than an invented terminal status.
- `REQ-005`: The current external-side-effects gate and missing-token behavior remain before any Meta or log side effect; suppressed events must not call Meta or write a CAPI log.
- `REQ-006`: Product-page ViewContent tracking must capture request data before registering a request-API-free callback through Next.js `after()` in the request scope, preserving the current fire-and-forget customer-visible behavior and containing registration/callback failures.
- `REQ-007`: All existing event payloads, event IDs, deduplication semantics, response handling, and four event-type wrappers remain behaviorally compatible; no customer-visible path may await telemetry as part of its response.
- `REQ-008`: Timeout, partial-completion, and provider/database failure outcomes must be observable with bounded, redacted logs and must not create unhandled promise rejections.
- `REQ-009`: The implementation must cover every current invocation: AddToCart, both InitiateCheckout paths, both Purchase paths, and ViewContent. The Linear description's “four call sites” is treated as four event types, not a reason to omit duplicate checkout implementations.

## Architecture

### Bounded execution

Add a server-only HTTP-service adapter through the SDK's supported `EventRequest.setHttpService` seam. The adapter posts the SDK-provided URL, method, headers, and params as JSON using `fetch` with an `AbortController`, aborts at the Meta deadline, checks the response status, parses the JSON body, and returns the response shape expected by `EventRequest.execute()`. Use a small timeout primitive around the adapter and each DB operation that clears its timer and never creates an unhandled rejection. Use named constants for the initial defaults: Meta attempt `3_000 ms` and each database operation `1_000 ms`. These are telemetry budgets, not customer-facing SLAs; the implementation PR must record measured Vercel outcomes and may tune them only with an evidence-backed contract update.

The installed `facebook-nodejs-business-sdk@24.0.1` exposes `EventRequest.setHttpService`/`HttpServiceInterface`; its default Axios path has no timeout or abort signal, so it must not be used for this path. The adapter must retain the SDK-generated Graph URL, payload fields, access-token placement, headers, and response semantics. Unit tests must assert that timeout invokes `AbortController.abort()` and that no default SDK request path is used. Map non-2xx/provider responses to `provider_rejected`, network/DNS/TLS/reset/abort failures to `transport_error` or `timed_out`, and non-JSON or structurally unusable success responses to `invalid_response`.

### Independent logging and truthful status

After the existing gate, token check, payload construction, and request construction:

1. Start the bounded Meta attempt.
2. Start a bounded insert into `capi_logs` with the event payload and `status: pending`, returning the inserted row ID. These promises must be created before either is awaited.
3. Collect both with `Promise.allSettled`. Report a Meta timeout/rejection as `failed`; report an initial log failure independently without changing the Meta result.
4. When an initial row exists and the Meta result is known, issue one bounded update by the returned row ID to set `status` to `success` or `failed` and persist the provider response/error representation. If this update fails or is cut off, leave `pending` as an explicit unknown state and emit a redacted diagnostic.

No migration is authorized: `capi_logs.status` is already free-form text. Persist terminal provider diagnostics as `{ version: 1, outcome: "accepted" | "provider_rejected" | "timed_out" | "transport_error" | "invalid_response", httpStatus?: number, code?: string, message?: string }`, projecting only safe scalar fields. Keep terminal `capi_logs.status` as `success` or `failed` and use `response.outcome` to render `Accepted`, `Provider rejected`, `Timed out/unknown`, `Transport error`, or `Invalid response`. The initial row uses `status: pending` and `{ version: 1, outcome: "pending" }`; dashboard and CSV show `Pending/unknown` distinctly. For legacy rows without `response.version/outcome`, render `Legacy success` when status is `success` and `Legacy failed` for other terminal statuses, preserving raw response in export. DB insert/update failures are emitted as structured server diagnostics and do not get serialized as provider response objects.

### Request lifecycle

The product page imports `after` from `next/server` and registers a callback around a request-API-free ViewContent sender while still attaching an error handler. Before calling `after()`, the page captures the current request headers/cookies needed for `userAgent`, IP, referer, country, `fbp`, and `fbc`, and passes that plain data into the callback. The callback must not call `headers()`, `cookies()`, `currentUser()`, or another request API. The existing page already has the Clerk/DB user data needed for the event; payload fields must remain equivalent. Wrap the synchronous `after()` registration in `try/catch`; if registration is unavailable, emit a redacted diagnostic and skip telemetry so product rendering cannot fail. Client-side AddToCart and checkout fire-and-forget call sites remain non-blocking and retain their local `.catch()` handling.

### State and consistency

This is best-effort telemetry. A Meta event may be accepted while its log insert/update fails; a log may be pending when the function ends. The contract must never retry automatically, duplicate an event ID, or block an order/payment transition to repair telemetry. A timeout is a timed-out/unknown delivery attempt, not evidence that Meta did not receive the request; operational reporting must distinguish provider response, timeout, transport error, invalid response, and log-persistence failure in a stable JSON-safe diagnostic shape.

For DB deadlines, build the existing Drizzle insert/update query, obtain its SQL and parameters, execute through the Drizzle-exposed `db.$client` Postgres.js query handle, and invoke that handle's supported synchronous `cancel()` method at the deadline. `Query.cancel()` returns no promise in the installed driver: do not invent or await a cancellation promise. Attach fulfillment and rejection handlers to the original query before the deadline and contain synchronous errors from the cancel call. At the deadline the application reports `pending`/unknown because cancellation is advisory and cannot be confirmed through this API; a late successful or failed settlement is observed and may create/update or diagnose the pending row, and is not retroactively treated as a confirmed database write at the cutoff. This explicit unknown state is why no operation may use a timed-out write as evidence of absence or perform an automatic retry.

Persist terminal provider diagnostics as `{ version: 1, outcome: "accepted" | "provider_rejected" | "timed_out" | "transport_error" | "invalid_response", httpStatus?: number, code?: string, message?: string }`, projecting only safe scalar fields. Keep `capi_logs.status` as `success` or `failed` for terminal compatibility and use `response.outcome` to render `Accepted`, `Provider rejected`, `Timed out/unknown`, `Transport error`, or `Invalid response`. The initial row uses `status: pending` and `{ version: 1, outcome: "pending" }`; dashboard and CSV show `Pending/unknown` distinctly. For legacy rows without `response.version/outcome`, render `Legacy success` when status is `success` and `Legacy failed` for other terminal statuses, preserving raw response in export. DB insert/update failures are emitted as structured server diagnostics and do not get serialized as provider response objects.

## Scenarios

- `SCN-001`: Authorized Meta and log operations complete within their budgets; the event is sent and its log becomes `success`.
- `SCN-002`: Meta rejects, times out, encounters a transport error, or returns an invalid response while log persistence remains available; the log becomes `failed` with a safe typed diagnostic and the caller settles within the bounded budget.
- `SCN-003`: Initial log insert is slow/fails while Meta succeeds; Meta result is returned, no false terminal log is created, and the failure is observable without waiting for Meta beyond its budget.
- `SCN-004`: Initial log insert succeeds, but terminal status update times out/fails or cannot confirm cancellation; the row is `pending`/unknown at the cutoff, any late settlement remains possible, and the Meta result is not rewritten.
- `SCN-005`: Meta is slow while the initial DB insert is fast; both operations begin independently and the DB result is not delayed until the Meta response.
- `SCN-006`: External side effects are disabled or the access token is absent; neither Meta nor CAPI-log persistence is attempted and the existing skip behavior remains safe.
- `SCN-007`: Product ViewContent captures request-derived data before registration; `after()` registers a request-API-free telemetry callback, customer response rendering does not await it, and callback or synchronous registration errors are contained.
- `SCN-008`: AddToCart and both checkout implementations invoke telemetry from client flows; customer-visible interaction/order/payment behavior is unchanged when Meta or DB is slow or unavailable.
- `SCN-009`: A transport error, malformed provider response, malformed DB error, or timeout is handled without an unhandled rejection, secret leakage, or invalid JSONB response.
- `SCN-010`: A repeated event ID reaches the same existing best-effort path; no new retry or deduplication behavior changes Meta delivery semantics.

## Invariants

- `INV-001`: No authorized CAPI operation can await an unbounded Meta request or database promise; each has a deadline and supported cancellation attempt, and late DB settlement is explicitly treated as unknown.
- `INV-002`: Meta and initial log persistence are independent promises; one settlement cannot cancel or short-circuit the other.
- `INV-003`: A terminal `success` log is written only when Meta reports acceptance; a terminal `failed` log is written only for provider rejection, timeout, transport error, or invalid response; incomplete persistence remains `pending`/unknown at cutoff.
- `INV-004`: Side-effect gating precedes both provider I/O and CAPI-log writes.
- `INV-005`: Telemetry failure never changes order, payment, checkout, product-render, or other business state.
- `INV-006`: The event ID and payload shape passed to Meta remain unchanged for all four event types.
- `INV-007`: Every started promise is observed by `allSettled`, a catch, or an equivalent terminal handler; no unhandled rejection is introduced.
- `INV-008`: Timeout timers are cleaned up after settlement and do not accumulate across repeated events.
- `INV-009`: Diagnostics and persisted response data never contain the CAPI access token or newly introduced raw secrets.
- `INV-010`: The ViewContent callback is scheduled with `after()` within the request scope, receives all request-derived data captured before registration, calls no request API, and is not synchronously awaited by page rendering.

## Flows

- `FLOW-001`: Authorize → construct payload/request → start abortable Meta attempt and cancelable pending-log insert → `Promise.allSettled` → bounded/cancelable terminal log update → return Meta result.
  - state_transitions:
      - from: `not_started`
        to: `authorized`
      - from: `authorized`
        to: `attempts_started`
      - from: `attempts_started`
        to: `meta_settled_and_log_insert_settled`
      - from: `meta_settled_and_log_insert_settled`
        to: `terminal_logged`
      - from: `meta_settled_and_log_insert_settled`
        to: `pending_log_or_log_failure`
- `FLOW-002`: Product request → capture request data → register request-API-free ViewContent callback with `after()` → response lifecycle closes → bounded telemetry callback settles, or safely skip on registration failure.
  - state_transitions:
      - from: `request_rendering`
        to: `request_data_captured`
      - from: `request_data_captured`
        to: `telemetry_registered`
      - from: `telemetry_registered`
        to: `response_finished`
      - from: `response_finished`
        to: `telemetry_settled_or_contained_failure`

## Dependencies and integrations

Dependencies:

- `DEP-001`: `src/lib/fb-capi.ts`, its typed environment token, sanitizer, side-effect gate, and `capi_logs` schema; status and payload compatibility must be preserved.
- `DEP-002`: `src/actions/analytics.ts` server actions and six current invocation expressions across the product, checkout, and cart flows.
- `DEP-003`: Next.js `15.5.16` Node runtime and `next/server` `after()` request-lifecycle support.
- `DEP-004`: `postgres@3.4.5`/Drizzle client and current connection configuration; this issue does not change pool sizing (REN-139).
- `DEP-005`: REN-143's external-side-effect gate and REN-116/REN-92's token remediation are baseline/coordination constraints, not duplicate scope.

Integrations:

- `INT-001`: Meta Graph API via `facebook-nodejs-business-sdk`; outbound event delivery and provider failure/timeout semantics.
- `INT-002`: Postgres `capi_logs` persistence via Drizzle; initial and terminal status writes.
- `INT-003`: Vercel Node function lifecycle/metrics; `after()` callback completion and billed duration.
- `INT-004`: CAPI log dashboard and CSV export; pending/unknown status display and existing terminal status behavior.

Personas:

- `PER-001`: Customer or shopper — receives the same page/checkout/order response without telemetry latency.
- `PER-002`: Operations/analytics user — can distinguish successful, failed, pending, and unknown CAPI logging outcomes.
- `PER-003`: Application operator — can investigate bounded timeout and persistence diagnostics without secrets or raw provider credentials.

Security boundaries:

- `SEC-001`: Server-only token/provider/database code; no client import of secrets or DB handles.
- `SEC-002`: Existing `shouldRunExternalSideEffects()` gate remains the authorization boundary before Meta or log side effects.
- `SEC-003`: Error/timeout diagnostics and JSONB response data must not expose access tokens, credentials, or newly expanded PII.
- `SEC-004`: Existing CAPI log authorization (`VIEW_ORDERS`, `MANAGE_ORDERS`, order-manager, or administrator) remains unchanged.

Business rules:

- `BR-001`: CAPI is non-critical telemetry; a delivery or logging failure must not fail a customer business operation.
- `BR-002`: No automatic retry or queue/worker architecture is introduced; the issue explicitly rejects that disproportionate design.
- `BR-003`: “Success” means Meta accepted the request, not merely that a local promise started; timeout is not proof of non-delivery.

## Decisions

- `DEC-001`: What initial timeout budgets should be used? Class `RECOMMEND_CONTINUE`; status `resolved`; recommendation: begin with 3 seconds for Meta and 1 second per DB operation as named constants, then tune only from post-deploy evidence; confidence `medium`; consequence `low`; human_confirmation_required: `false`.
- `DEC-002`: How can initial logging be concurrent while retaining truthful outcome status? Class `AUTO_DECIDE`; status `resolved`; recommendation: use a pending insert, `Promise.allSettled`, and a bounded terminal update without a schema migration; confidence `high`; consequence `medium`; human_confirmation_required: `false`.
- `DEC-003`: How should the Meta timeout cancel the SDK request? Class `AUTO_DECIDE`; status `resolved`; recommendation: inject a local `HttpServiceInterface` adapter through `EventRequest.setHttpService`; use fetch plus AbortController and preserve SDK URL, params, headers, and response semantics; confidence `high`; consequence `medium`; human_confirmation_required: `false`.

## Investigation evidence

Investigated:

- Linear REN-138 metadata, priority High, Backlog status, empty comments, feature branch name, and relations to REN-92, REN-114, REN-116, and REN-143.
- Related Linear descriptions: REN-92/116 token scope, REN-114 side-effect gate scope, REN-139 database-pool scope, and REN-143's explicit exclusion of CAPI duration optimization.
- `src/lib/fb-capi.ts`, `src/actions/analytics.ts`, product page, cart tracking hook, both checkout implementations, CAPI schema/router/dashboard, env and side-effect gate.
- Installed package sources for Next `after()` and `facebook-nodejs-business-sdk@24.0.1`; SDK default request path has no timeout option and internally creates Axios options without `timeout`, while the SDK also exposes `EventRequest.setHttpService`/`HttpServiceInterface.executeRequest(url, method, headers, params)` for the selected cancelable adapter.
- Current focused and full Bun baseline: 89 tests run, 88 passed, 1 skipped, 0 failed. Existing `external-side-effects` tests intentionally document current fail-open behavior outside this issue's separate REN-143 scope.
- Current Git baseline is `origin/main` at `52cd5704`; the original checkout was clean but on the unrelated REN-143 branch, so this contract is isolated on the Linear-matching branch above.

Excluded:

- Meta token rotation/revocation and environment schema changes: REN-92/REN-116.
- External-side-effect authorization redesign, provider kill-switch policy, and staging isolation: REN-143/REN-114.
- Database pool sizing/driver migration: REN-139.
- Redis tuning, Node migration, build-trigger changes, queue/worker architecture, schema migrations, order/payment/shipping semantics, and general analytics redesign: no dependency path for this telemetry optimization.
- Vercel dashboard mutation, production deployment, Linear workflow changes, and application implementation/tests: prohibited during SPEC.
- Referenced `docs/infrastructure-audits/2026-08-25/*` documents: absent from the inspected Git baseline; Linear's cited evidence is recorded as issue context, not repository-verifiable source text.

Uncertainties:

- Whether the deployed Next/Vercel configuration exposes `after()`/`waitUntil` on every relevant product-page runtime; local Next 15.5.16 supports it, and registration failure must remain safely contained.
- Whether operations wants a separate dashboard filter for `response.outcome`; stable labels and CSV values are specified, but filtering is not required.

## Test expectations

The machine-readable contract contains the authoritative mappings. Required coverage includes unit tests for AbortController cancellation, timeout settlement/timer cleanup, mocked Meta/DB latency and rejection combinations, concurrent-start ordering, pending-to-terminal transitions, gate/token skips, safe error serialization, and all invocation wrappers. Component or UI tests must cover pending/unknown and typed timeout/provider-rejection dashboard/CSV rendering. Integration tests must cover request-data capture before `after()`, request-API-free callback execution, synchronous registration failure, and `after()` callback completion. Performance/exploratory validation must compare Vercel duration and the two cited error signatures before/after deployment; no absolute dollar-saving claim is accepted.

## Approval gate

This contract is `READY_FOR_DEV` only after the independent L2 Critic reviews every required category, the Critic findings are resolved or preserved explicitly, the cancelable SDK transport and request-API-free `after()` flow are accepted, all requirements/scenarios/invariants/flows/test expectations are traceable, and `bun run governance:validate -- docs/.work-items/REN-138/work-item.yaml` passes. No implementation-review result is created during SPEC.
