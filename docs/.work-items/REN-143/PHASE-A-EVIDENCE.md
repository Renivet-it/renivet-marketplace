# REN-143 Phase A Evidence

Date: 2026-08-27  
Operator: Ayan Ganguly  
Approver: <enter approver name>

## Deployments

- Staging project: `renivet-marketplace-staging`
- Staging branch: `main`
- Staging deployment ID/SHA: `<copy from Vercel>`
- Production project: `renivet-marketplace`
- Production branch: `master`
- Production deployment ID/SHA: `<copy from Vercel>`

## Environment safety

- Staging `APP_ENV`: `staging` (confirmed)
- Production `APP_ENV`: `production` (confirmed)
- Database isolation: separate staging and production resources (confirmed)
- Redis isolation: separate staging and production resources (confirmed)
- Razorpay: staging test keys (confirmed)
- Delhivery: separate staging test account/token (confirmed)
- Analytics: disabled in staging; enabled in production (confirmed)
- Clerk: separate staging test users (confirmed)
- Shiprocket: unused in staging workflows (confirmed)

## Test results

| Test | Result | Evidence |
|---|---|---|
| Staging cron with `Authorization: Bearer ...` | PASS | HTTP 200 from `Delhivery_Polling_Api_Stg` |
| Staging cron with kill switch off | PASS | Response contained `skipped: true` and `external_side_effects_disabled` |
| Staging COD test order | PASS | Internal staging order was created |
| Staging external effects | PASS | No email, WhatsApp message, Delhivery AWB, or analytics event observed |
| Production kill switch | PASS | Enabled and read-only in production UI |
| Production cron | PASS | Production Delhivery cron returned HTTP 200 |
| Production controlled flow | PASS | Controlled production flow completed normally |

## Vercel Phase B evidence

- Staging Ignored Build Step: `Only build production`
- Feature-branch staging build test: `<record Vercel result>`
- Main-to-staging deployment test: `<record Vercel result>`
- Rollback test: `<record Vercel result>`
- Build count / Build CPU comparison: `<record before/after metrics>`

## Secrets

No secrets, tokens, credentials, or credential-bearing URLs are included in this document.
