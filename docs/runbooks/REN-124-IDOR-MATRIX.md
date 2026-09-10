# REN-124 IDOR/BOLA test matrix

This harness is read-only and is intended for local or staging environments. It tests orders, invoices, corporate quotes, payment-request token GET access, addresses, and carts across unauthenticated, wrong-user, owner, and tampered-identifier cases.

## Safety requirements

Set `IDOR_TARGET_ORIGIN` to a local or explicitly approved staging origin and list the exact origin in `IDOR_ALLOWED_ORIGINS`. Production domains, unknown hosts, IP literals, and redirect destinations outside the allowlist are rejected. For staging, also set `IDOR_ALLOW_NONLOCAL_TARGET=true` and `IDOR_NONLOCAL_ACKNOWLEDGEMENT=REN-124-STAGING`.

Do not commit the fixture file, browser state files, cookies, tokens, or reports containing raw responses. The runners emit only case metadata, status/classification, timing, and a one-way target-origin hash.

## Fixture contract

Create an untracked JSON file referenced by `IDOR_FIXTURES_FILE`:

```json
{
  "ownerUserId": "<owner user id>",
  "wrongUserId": "<unrelated user id>",
  "ownerBrandId": "<authorized brand id>",
  "wrongBrandId": "<unrelated brand id>",
  "resources": {
    "order": { "id": "<owner order id>", "ownerUserId": "<owner user id>", "tamperedId": "<different order id>" },
    "invoice": { "orderId": "<invoice order id>", "ownerUserId": "<owner user id>", "token": "<valid signed token>", "wrongToken": "<invalid token>", "mismatchOrderId": "<different order id>" },
    "corporateQuote": { "id": "<owner quote id>", "ownerUserId": "<owner user id>", "tamperedId": "<different quote id>" },
    "paymentRequest": { "token": "<valid GET token>", "wrongToken": "<invalid token>", "status": "open" },
    "address": { "id": "<owner address id>", "ownerUserId": "<owner user id>", "tamperedId": "<different address id>" },
    "cart": { "ownerUserId": "<owner user id>", "tamperedUserId": "<different user id>" }
  }
}
```

The preflight rejects owner/wrong-user or owner/wrong-brand identity collisions, mismatched ownership, equal valid/tampered identifiers, equal tokens, and unsupported payment-request status values.

For authenticated cases, provide temporary session material through environment variables only:

- `IDOR_OWNER_COOKIE` and `IDOR_WRONG_USER_COOKIE` for direct HTTP/tRPC probes.
- `IDOR_OWNER_STATE` and `IDOR_WRONG_USER_STATE` for isolated `agent-browser` sessions.
- `IDOR_BRAND_STATE`, `IDOR_WRONG_BRAND_STATE`, and `IDOR_ADMIN_STATE` for corporate scope cases.

## Run

PowerShell example for local execution:

```powershell
$env:IDOR_TARGET_ORIGIN = "http://localhost:3000"
$env:IDOR_ALLOWED_ORIGINS = "http://localhost:3000"
$env:IDOR_FIXTURES_FILE = ".\idor.fixtures.local.json"
bun run security:idor:api
bun run security:idor:browser
```

The API runner covers direct HTTP/tRPC cases. The browser runner covers UI-reachable cases and uses one browser session per access identity. Both commands return a nonzero exit status for an unexpected allow/deny result, fixture drift, unsafe redirect, timeout, malformed response, or cleanup failure.

Payment-request `POST checkout` and `POST confirm` are intentionally not invoked because they create payment state. Their GET capability behavior is covered here; replay/idempotency testing requires a separate mocked payment plan.

## Outcome interpretation

`allow` is expected only for the owner positive control and valid capability-token cases. Protected unauthenticated cases should be `unauthorized`; wrong-user or wrong-scope cases should be `forbidden` or `not_found`; malformed/tampered identifiers should be `validation_error` or `not_found`. `error` means the harness could not establish an authorization result and is never a pass.

Attach the redacted JSON output to REN-124 only after confirming it contains no cookies, tokens, resource IDs, response bodies, or browser state paths.
