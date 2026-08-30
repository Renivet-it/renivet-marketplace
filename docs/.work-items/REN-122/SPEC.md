# REN-122 Specification

## Goal

Run a bounded proof of concept for `agent-browser network route --abort` that proves browser-originated matching requests are aborted before completion, records the exact route patterns and evidence, and states the mechanism's boundary relative to the application's server-side provider calls.

## Evidence and scope

- Linear requests a second safety layer for automated runs targeting Delhivery, Twilio, Meta CAPI, and Resend.
- The requested Linear branch is `ayanganguly333/ren-122-network-level-request-blocking-spike-for-agent-browser-runs`; the current branch differs and already contains unrelated, uncommitted work. This specification must not alter that work.
- `agent-browser` is not currently available on the workspace PATH, so the proof cannot be executed here until its supported runtime is provisioned.
- `src/lib/delhivery/client.ts`, `src/lib/fb-capi.ts`, `src/lib/whatsapp/index.ts`, and `src/lib/resend/index.ts` make provider calls from the Next.js server/runtime. CDP network routing only observes and controls requests made by the automated browser; it does not control server-side egress initiated by a browser request.
- Existing code-level gating is `shouldRunExternalSideEffects()`, based on `isProductionEnvironment()` and a platform setting. Delhivery and Meta CAPI use it; `sendWhatsAppNotification` also gates one action before the direct underlying Twilio module, which can send without that gate. The gate defaults to enabled outside production when no setting exists. Importing/constructing the Resend client does not itself make a network call and its send call sites are outside this spike.

## Acceptance criteria

- A reproducible, no-real-provider-call proof run installs abort routes before navigation or any triggering browser action.
- The proof covers the explicit provider host patterns: `https://track.delhivery.com/**`, `https://api.twilio.com/**`, `https://graph.facebook.com/**`, and `https://api.resend.com/**`.
- For each pattern, evidence records route registration, the exact redacted synthetic request URL and method, route-match sequence, and an explicit abort disposition. A generic failed fetch alone is insufficient because CORS, DNS, TLS, or transport failures can look similar. The proof uses harmless synthetic browser-side GET requests to a fixed no-query, no-credential path and must not send credentials, personal data, orders, emails, WhatsApp messages, or analytics events.
- The report explicitly distinguishes browser-originated blocking from server-side provider egress and must not claim the former protects the latter.
- Any future automated-run harness must install all routes before opening the target application, must fail closed if route installation fails, and must remove routes/close the browser in a finally-equivalent cleanup path even after synthetic-request or evidence-capture failure.
- No production configuration, credentials, provider integrations, application side-effect gating, or test data are changed by this spike.

## Proposed design

Add a task-scoped executable proof/runbook only after the unresolved safety-scope decision is approved and the supported agent-browser runtime/version and route-reporting semantics are recorded. The run will open a neutral local or data page, register the four explicit abort patterns with `agent-browser network route --abort`, then issue one browser-context GET to a fixed no-query, no-credential path under each host. It will capture command output or an equivalent local evidence file showing route registration, redacted URL/method, route-match sequence, and explicit abort disposition. It will deliberately avoid app journeys that could cause server-side provider calls. A separate safe local controlled endpoint may be used as a negative control for the proof harness; a lack of a provider response is never treated as route-match evidence by itself.

This is a validation of CDP's browser boundary, not a production egress control. Server-side protection remains the existing application gate and requires a separate infrastructure/proxy/firewall design if independent server-egress blocking is required.

## Scope decision

The issue describes an independent safety layer for calls that the repository makes server-side. Choose one of these scopes before implementation:

1. **Recommended:** approve a browser-only CDP proof that records its non-coverage of server egress, then create a separate task for server-egress enforcement.
2. Require a real server-egress safety layer now (proxy/firewall/egress policy). This is a broader infrastructure/security design and cannot be honestly implemented as an agent-browser-only spike.

Owner confirmation: Ayan Ganguly approved option 1 on 2026-08-31. Implement only the browser-originated CDP proof, document its non-coverage of server egress, and treat any infrastructure egress control as a separate future task. The scope blocker is resolved; runtime provisioning remains a preflight dependency.

## Test expectations

- A runbook/exploratory test verifies each of the four configured patterns is installed before the synthetic request and records an aborted outcome.
- A negative-control run without the route demonstrates that the proof is actually exercising browser routing, using only a safe local controlled endpoint or non-sensitive request path.
- A regression/static check confirms no application source, provider credentials, production configuration, or existing external-side-effect gate is changed.
- An operator review verifies the report explicitly says CDP routes do not block Next.js server-to-provider traffic.

## Implemented proof

`agent-browser@0.35.1` is pinned as a development dependency and the runnable proof is `bun run agent-browser:network-blocking-spike`. Its runner opens only `about:blank`, installs all four abort routes, makes fixed credential-free browser `GET` probes, requires route-registration + failed-probe + matching request-without-status evidence, and removes every route before closing the browser in `finally` cleanup. It does not navigate the Renivet application.
