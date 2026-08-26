# REN-143 Phase B Evidence

Date: 2026-08-27  
Operator: Ayan Ganguly  
Approver: <enter approver name>

## Selected control

- Staging project: `renivet-marketplace-staging`
- Tracked branch: `main`
- Ignored Build Step: `Only build production`
- Metric: staging build count and Build CPU
- Deployment-count/quota/currency-savings claim: none

## Validation matrix

| Git action | Expected | Observed result | Evidence |
|---|---|---|---|
| Feature-branch push | Production-project Preview remains available; staging build is skipped | PASS — production-project Preview was Ready; staging was canceled by Ignored Build Step | `<Vercel deployment URL or ID>` |
| `main` merge/push | Staging production deployment succeeds at `staging.renivet.com` | PASS — staging deployment confirmed green | `<Vercel deployment URL or ID>` |
| `master` merge/push | Production deployment succeeds; staging is not unnecessarily built | PASS — production deployment confirmed green | `<Vercel deployment URL or ID>` |
| Rollback | Restoring the prior Vercel setting works immediately | `<record result>` | `<Vercel setting/deployment evidence>` |

## Measurements

- Before-window: `<date/time window and staging build count>`
- After-window: `<date/time window and staging build count>`
- Build CPU before: `<Vercel metric or unavailable>`
- Build CPU after: `<Vercel metric or unavailable>`
- Method: same sampling window and branch/project filters before and after

## Safety checks

- Production project preview behavior unchanged: `<PASS/FAIL with evidence>`
- `main` staging deployment behavior unchanged: `<PASS/FAIL with evidence>`
- `master` production deployment behavior unchanged: `<PASS/FAIL with evidence>`
- Staging domain remains available: `<PASS/FAIL with URL>`

## Secrets

No deploy hooks, tokens, credentials, or secret values are included in this document.
