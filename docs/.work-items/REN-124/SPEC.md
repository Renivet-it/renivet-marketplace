# REN-124 Engineering Specification

## Objective

Build a repeatable, fail-closed IDOR/BOLA test matrix for the six resource families named by REN-124: orders, invoices, corporate quotes, payment-request tokens, addresses, and carts. The matrix must exercise unauthenticated, wrong-user, owner, and tampered-identifier access modes through the appropriate browser or direct-HTTP channel and emit auditable results without recording credentials or sensitive response bodies.

## Repository evidence

- `src/lib/trpc/routes/general/orders.ts` protects customer order reads with `ctx.user.id` comparisons, while `src/lib/trpc/routes/general/address.ts` delegates `getAddressById` to a query without an owner predicate; the matrix must detect both safe and unsafe behavior.
- `src/lib/trpc/routes/general/cart.ts` protects `getCartForUser` with a user-ID comparison.
- `src/lib/trpc/routes/general/corporate-orders.ts` and `src/lib/trpc/routes/general/corporate-platform.ts` expose corporate order/quote procedures with customer and privileged surfaces that require separate identities.
- `src/app/api/invoices/[orderId]/download/route.tsx` uses a signed invoice token; `src/app/api/corporate-payment-requests/[token]/route.ts` is a public token surface and must be tested as a token-bound capability rather than as a user-owned page.
- `scripts/ren-122-network-blocking-spike.ts` demonstrates the repository's Bun-spawned `agent-browser` command seam and cleanup pattern.
- The project uses `/api/trpc` as the direct HTTP transport and has existing Vitest/Bun tests for deterministic security helpers.

## Design

The implementation will add task-local security test tooling only:

1. A typed matrix manifest defines resource, access mode, persona/scope, channel, endpoint/page, fixture input, expected HTTP/tRPC/browser classification, and sensitivity. Corporate resources distinguish customer owner, unrelated customer, brand user, unrelated brand user, and privileged/admin scope; capability resources distinguish valid-token unauthenticated/wrong-user, wrong-token, expired-token, and resource-mismatch cases. The manifest is the single source of truth for coverage.
2. A direct HTTP runner executes read-only API/tRPC cases with fixture-provided cookie/header state and identifier values. It classifies status and tRPC error codes (`allow`, `unauthorized`, `forbidden`, `not_found`, `validation_error`, `redirect`, or `error`) per case, and records only redacted evidence metadata; it never records response bodies, cookies, authorization headers, or token values.
3. An `agent-browser` runner executes browser cases using pre-authenticated state files supplied by the operator. It uses isolated sessions per identity, enforces the same positive origin allowlist before every navigation, checks explicit page/redirect denial signals, captures only safe metadata, and always closes sessions.
4. A validator/report formatter enforces matrix completeness and fails if a case is missing a persona/scope, access mode, expected classification, target channel, fixture binding, safety declaration, or resource ownership assertion.
5. A typed fixture contract validates that owner, unrelated-user, brand, and unrelated-brand identities are distinct and that every resource identifier/token has the declared relationship, status, and tampered form before any probe runs. Fixture drift aborts the run.
6. A runbook documents staging/local-only defaults, positive origin allowlisting, fixture setup, exact commands, GET-only payment-token scope, expected classifications, evidence fields, cleanup, interpretation, runtime versions, and how to attach redacted JSON evidence to the REN-124 work item.

No application authorization behavior, database schema, route contract, or production configuration is changed by this issue. A failing case is evidence of a security finding and must not be silently converted into an expected allow.

## Safety and execution policy

- The runner accepts only an explicit positive origin allowlist: loopback origins or operator-supplied staging origins listed in `IDOR_ALLOWED_ORIGINS`. It rejects IP literals, unknown hostnames, production domains, and non-HTTP(S) origins by default. Any non-local origin additionally requires `IDOR_ALLOW_NONLOCAL_TARGET=true` and an operator-supplied acknowledgement.
- Every direct request and browser navigation validates the final URL origin; redirects to an origin outside the allowlist fail the case and abort the run. Browser navigation uses redirect blocking where supported and records no external response data.
- No credentials, session state files, raw cookies, bearer tokens, payment tokens, or response bodies are written to output.
- Fixture IDs and test identities are supplied through a typed local untracked fixture file or environment variables; the repository contains only symbolic fixture names. Preflight proves ownership/scope and resource status without mutation.
- The browser runner uses separate named sessions for unauthenticated, owner, and wrong-user cases and closes every session in a `finally` path.
- The matrix is read-only. The payment-request token surface is intentionally limited to GET capability checks; POST `checkout` and `confirm` are not invoked. Their exclusion and expected future coverage are reported as an explicit scope boundary, not treated as tested behavior.
- Browser cleanup runs with bounded timeout, aggregates cleanup failures with the primary result, and returns nonzero if a session cannot be closed or isolation cannot be verified.

## Resource and capability semantics

- Customer-owned order, quote, address, and cart cases require owner allow and unrelated-customer deny/not-found according to the route contract; unauthenticated and tampered cases must deny/not-found.
- Brand and administrative corporate surfaces are tested with the authorized scope as the positive control and unrelated brand/customer scope as the negative control. A customer owner is not automatically an authorized brand/admin identity.
- Invoice download is a signed capability: valid-token unauthenticated and valid-token authenticated-with-unrelated-user are expected to allow if the token is valid; wrong-token, order/token mismatch, and malformed token are expected to deny/not-found.
- Payment-request GET is a public capability: valid token may allow without authentication; wrong, expired, and malformed tokens must deny/not-found. Account-bound tRPC checkout visibility is tested separately with owner and unrelated-account identities, but mutating POST actions are excluded.
- Dynamic payment state is not changed by this harness. Fixtures are snapshotted and checked immediately before execution; a status/ownership change causes an execution error and invalidates the run rather than changing the expected result.

## Safe evidence contract

Each result includes only `caseId`, `manifestVersion`, `runner`, `resource`, `accessMode`, `persona`, `expected`, `observed`, `status`, `errorCode`, `targetOriginHash`, `startedAt`, `durationMs`, and `attempt`. `targetOriginHash` is a one-way fingerprint; secrets, IDs, tokens, response bodies, and cookies are excluded.

## Expected outcome

The repository contains a versioned matrix and two executable runners that can be pointed at a seeded local/staging environment. The default run is deterministic, safe to execute, produces non-sensitive JSON evidence, and fails CI/exit status when a protected resource is accessible by an unauthenticated, wrong-user, or tampered identifier case.

## Out of scope

- Fixing authorization defects discovered by the matrix.
- Running against production or provisioning accounts/secrets.
- Creating or mutating real orders, invoices, quotes, carts, addresses, or payment requests.
- Executing payment-request `POST checkout` or `POST confirm`; those require a separate mocked/idempotency test plan.
- Replacing the existing auth model, adding a new authorization service, or changing the external payment/token contract.
