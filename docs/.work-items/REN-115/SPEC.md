# REN-115 Engineering Contract

Status: `READY_FOR_DEV`
Final risk: `L3`
Linear: REN-115 — Fix 4 hardcoded Delhivery production-URL bypass sites

## Scope

Replace the hardcoded Delhivery URL at exactly these four call sites with a shared server-only URL resolver using normalized `DELHIVERY_BASE_URL`:

1. `src/actions/order-tracking.ts:21` — tracking.
2. `src/lib/trpc/routes/general/orders.ts:2093` — dimension edit.
3. `src/lib/trpc/routes/general/returnReplace.ts:695` — RTO/return creation.
4. `src/lib/trpc/routes/general/returnReplace.ts:842` — replacement creation.

Production must continue using `https://track.delhivery.com` through the explicit fallback inside that resolver when `DELHIVERY_BASE_URL` is absent or blank. The four request expressions must not directly embed the production URL.

## Non-goals

This issue does not change the existing kill switch, staging policy, Razorpay refunds, schemas, migrations, provider retries, or other Delhivery paths. Those are separate work. The developer explicitly superseded the kill-switch portion of the Linear description on 2026-08-26; REN-143 retains ownership of non-production no-op behavior.

## Design

- Treat `DELHIVERY_BASE_URL` as trusted, operator-controlled server configuration because it receives the Delhivery credential. Accept absolute HTTP(S) URLs, trim whitespace and trailing slashes, reject malformed non-empty values before network I/O, and keep the production fallback literal only inside the resolver.
- Preserve the existing HTTP methods, paths, authentication headers, payloads, response parsing, caller results, and state writes.
- Keep credentials and payloads server-only. Do not introduce new sensitive logging or browser exposure.

## Required verification

- Request-spy tests prove all four sites use a custom normalized base URL.
- Fallback tests prove all four sites retain the production URL when the variable is absent or blank.
- Production regression tests prove methods, paths, headers, payloads, parsing, caller behavior, and state writes remain unchanged.
- All automated tests mock fetch, Axios, and Razorpay; no live credentials or external network calls are permitted.
- Source and diff scans prove only the four named URLs and focused tests/helpers changed.

## Rollback

Use a selective or forward rollback that retains the environment-based URL resolution. Do not blindly restore the four hardcoded URLs.

## Approval gate

The Critic must confirm this URL-only scope. Once approved, the contract can become `READY_FOR_DEV`; implementation then proceeds with no kill-switch or refund changes.
