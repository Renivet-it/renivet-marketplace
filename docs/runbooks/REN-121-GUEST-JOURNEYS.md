# REN-121 guest journeys

The suite is read-only and stops at authentication walls. It never submits forms, adds items, starts checkout, or invokes Razorpay.

```powershell
$env:E2E_BASE_URL = "http://localhost:3000"
bun run test:e2e
```

For staging, provide an exact allowlisted origin in both variables:

```powershell
$env:E2E_BASE_URL = "https://your-staging-origin.example"
$env:E2E_ALLOWED_ORIGINS = "https://your-staging-origin.example"
bun run test:e2e
```

Production origins are rejected. The runner emits only journey IDs, expected/observed classifications, timestamps, and the target origin.
