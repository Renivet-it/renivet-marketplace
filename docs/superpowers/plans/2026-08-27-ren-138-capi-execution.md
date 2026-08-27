# REN-138 CAPI Execution Path Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bound CAPI provider and log persistence work, preserve truthful observability, and keep every customer-facing path fire-and-forget.

**Architecture:** Keep `sendCapiEvent` as the single telemetry boundary. Inject a cancelable Meta HTTP service through the SDK's `EventRequest.setHttpService` seam, start Meta and a `pending` log insert independently, finalize by row ID when both settle, and use the existing Postgres.js query handle's synchronous `cancel()` attempt for DB deadlines. Capture product-page request data before scheduling a request-API-free sender with Next.js `after()`.

**Tech Stack:** Next.js 15.5.16, TypeScript, facebook-nodejs-business-sdk 24.0.1, Drizzle ORM, postgres 3.4.5, Bun tests, React dashboard.

**Spec:** `docs/.work-items/REN-138/SPEC.md`

## Global Constraints

- Meta attempt budget is `3_000 ms`; each CAPI-log database operation budget is `1_000 ms`.
- Meta timeout must abort the underlying fetch; the SDK default Axios request path must not be used.
- Meta and initial log persistence start independently and are collected with `Promise.allSettled`.
- Database `Query.cancel()` is synchronous/void; observe the original query settlement, contain synchronous cancel errors, and report unconfirmed deadline writes as `pending`/unknown.
- Terminal outcomes are `accepted`, `provider_rejected`, `timed_out`, `transport_error`, or `invalid_response`; terminal DB status remains `success` or `failed`, with `pending` for incomplete persistence.
- Product ViewContent captures request data before `after()` and invokes no request API inside the callback.
- No schema migration, automatic retry, queue/worker, pool-sizing, token, gate, order, payment, or customer-visible behavior change.
- Use TDD: write each behavioral test first, run it red, implement the minimum code, then run it green.

---

### Task 1: Bounded CAPI transport and truthful two-phase logging

**Files:**
- Modify: `src/lib/fb-capi.ts`
- Test: `src/lib/fb-capi.test.ts`

**Interfaces:**
- Preserve the existing exported `sendCapiEvent(eventName, userData, customData, eventId, eventSourceUrl)` signature and all existing payload fields.
- Add internal/exported test seams only where needed to inject the Meta HTTP service, database operation behavior, and clock/timers without changing application callers.
- Use a typed response shape with `version: 1` and the five terminal outcome strings plus `pending`.

- [ ] **Step 1: Write failing transport and lifecycle tests**

Add focused Bun tests that prove: the custom SDK HTTP service receives the SDK URL/headers/params; a deadline calls `AbortController.abort()`; non-2xx maps to `provider_rejected`; network failure maps to `transport_error`; malformed success maps to `invalid_response`; Meta and initial insert begin before either is awaited; insert failure does not suppress Meta; terminal update is by inserted row ID; `Query.cancel()` is invoked synchronously at a DB deadline; original query rejection is observed; and an unconfirmed DB write remains pending/unknown without retry.

- [ ] **Step 2: Run the focused tests and verify the expected red failure**

Run:

```text
bun test src/lib/fb-capi.test.ts
```

Expected: the new behavior tests fail because the current implementation uses the SDK default request path, serializes Meta before logging, and has no timeout/cancellation lifecycle.

- [ ] **Step 3: Implement the minimal cancelable Meta adapter and outcome classifier**

Use `EventRequest.setHttpService({ executeRequest(url, method, headers, params) { ... } })` with `fetch`, a per-attempt `AbortController`, and a timer at `3_000 ms`. Check HTTP status and JSON/body shape; classify errors into the contract's five terminal outcomes and persist only safe scalar diagnostics. Never serialize the SDK request object or access token.

- [ ] **Step 4: Implement independent pending insert and bounded terminal update**

Start the Meta promise and pending insert promise before awaiting either, collect both with `Promise.allSettled`, and update a successfully inserted row by ID only after the Meta outcome is known. Execute each Drizzle-generated SQL statement through `db.$client.unsafe(sql, params)` so the raw Postgres.js `Query` can receive a deadline and synchronous `cancel()` attempt. Attach fulfillment/rejection handlers to the original query before the deadline; do not await a nonexistent cancel promise. Preserve pending/unknown when the deadline is reached.

- [ ] **Step 5: Run the focused tests and verify green**

Run:

```text
bun test src/lib/fb-capi.test.ts
```

Expected: all transport, outcome, concurrency, cancellation, redaction, and timer-cleanup tests pass with no unhandled rejection output.

- [ ] **Step 6: Commit the task**

```text
git add src/lib/fb-capi.ts src/lib/fb-capi.test.ts
git commit -m "feat: bound CAPI delivery and logging"
```

### Task 2: Request-lifecycle-safe ViewContent integration

**Files:**
- Modify: `src/actions/analytics.ts`
- Modify: `src/app/(marketing)/products/[slug]/page.tsx`
- Test: `src/actions/analytics.test.ts` (create if no existing action test exists)

**Interfaces:**
- Preserve all four public analytics wrappers and their existing call signatures.
- Extract a request-data-free ViewContent sender that accepts already captured `{ userAgent, ip, referer, fbp, fbc, country }` values plus the existing user/custom/event inputs.
- Keep AddToCart, InitiateCheckout, and Purchase request-data behavior unchanged.

- [ ] **Step 1: Write failing lifecycle tests**

Cover that the ViewContent sender can run without calling `headers()` or `cookies()`, request-derived values are captured before callback registration, synchronous `after()` registration failure is contained, callback rejection is contained, and the existing wrappers still pass equivalent payload fields.

- [ ] **Step 2: Run the focused tests and verify the expected red failure**

Run:

```text
bun test src/actions/analytics.test.ts
```

Expected: the new tests fail because `trackViewContentCapi` currently reads request APIs internally and the product page calls it directly during server rendering.

- [ ] **Step 3: Implement the request-data-free sender and `after()` registration**

Capture headers/cookies in the product request scope, call `after()` inside `try/catch`, and schedule the request-data-free sender with an attached `.catch()`. Preserve the existing `.catch()` behavior around the product-page call and skip telemetry safely when registration is unavailable.

- [ ] **Step 4: Run focused and affected tests**

```text
bun test src/actions/analytics.test.ts src/lib/fb-capi.test.ts
```

Expected: all lifecycle and CAPI tests pass with no customer-path rejection.

- [ ] **Step 5: Commit the task**

```text
git add src/actions/analytics.ts src/actions/analytics.test.ts "src/app/(marketing)/products/[slug]/page.tsx"
git commit -m "feat: schedule product CAPI tracking after response"
```

### Task 3: Typed CAPI dashboard and CSV compatibility

**Files:**
- Modify: `src/app/(protected)/dashboard/capi-logs/page.tsx`
- Test: `src/app/(protected)/dashboard/capi-logs/page.test.tsx` (create if the dashboard has no existing test)

**Interfaces:**
- Consume the existing log query shape without changing router authorization or database schema.
- Derive a display label from `status` and `response.version/outcome`.
- Preserve raw response JSON for legacy export while adding explicit pending/unknown and typed outcome labels.

- [ ] **Step 1: Write failing dashboard compatibility tests**

Test display/export mapping for accepted success, provider rejection, timed out/unknown, transport error, invalid response, pending, legacy success, and legacy failed rows; verify no legacy response is discarded.

- [ ] **Step 2: Run the focused tests and verify the expected red failure**

Run:

```text
bun test "src/app/(protected)/dashboard/capi-logs/page.test.tsx"
```

Expected: the new tests fail because the dashboard currently maps every non-success status to `Failed` and has no typed outcome projection.

- [ ] **Step 3: Implement the display/export projection**

Add a small pure display helper in the dashboard module or a focused sibling module. Use `Pending/unknown`, `Accepted`, `Provider rejected`, `Timed out/unknown`, `Transport error`, `Invalid response`, `Legacy success`, and `Legacy failed` exactly as specified; keep raw response serialization in export.

- [ ] **Step 4: Run focused dashboard tests**

```text
bun test "src/app/(protected)/dashboard/capi-logs/page.test.tsx"
```

Expected: all typed and legacy display/export cases pass.

- [ ] **Step 5: Commit the task**

```text
git add "src/app/(protected)/dashboard/capi-logs/page.tsx" "src/app/(protected)/dashboard/capi-logs/page.test.tsx"
git commit -m "feat: distinguish CAPI log outcomes"
```

### Task 4: Full verification and governance handoff

**Files:**
- Verify: all changed implementation and test files above
- Update: `docs/.work-items/REN-138/work-item.yaml` only with implementation-review output through `renivet-review`

- [ ] **Step 1: Run the complete Bun test suite**

```text
bun test
```

Expected: zero failures and no new unhandled-rejection or timeout warnings.

- [ ] **Step 2: Run governance validation**

```text
bun run governance:validate -- docs/.work-items/REN-138/work-item.yaml
```

Expected: governance validation passes before implementation review.

- [ ] **Step 3: Run the Renivet implementation review**

Run `$renivet-review REN-138` against the approved contract and current Git diff. Resolve any material drift through the required governance path; do not silently rewrite the approved contract.

- [ ] **Step 4: Inspect final diff and status**

```text
git diff --check
git status --short --branch
```

Expected: only intended REN-138 implementation, test, and governance-review files are present.
