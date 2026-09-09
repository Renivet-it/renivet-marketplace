# OWASP ASVS Level 2 control matrix — Renivet engineering evidence

Date: 2026-09-10  
Scope: engineering evidence for the Renivet application only

## Important limitation

This document is an engineering evidence matrix. It is not a legal opinion, audit opinion, certification, SOC 2 report, or claim of full ASVS or SOC 2 readiness. It excludes policy, vendor, HR, physical-facility, and auditor-attestation controls. `Needs-review` means the repository evidence is incomplete or requires manual/deployment verification; it is not a finding that the control definitely fails.

## Matrix

| ASVS L2 area/control | Status | Evidence | Rationale / follow-up |
|---|---|---|---|
| V1.2.1 — secure architecture and trust boundaries | Needs-review | `src/middleware.ts:1-309`; `tests/ren-104-boundaries.test.ts:1-90` | Boundary evidence exists, but a complete architecture review is not present. |
| V2.1.1 — password/authentication policy | Needs-review | `src/middleware.ts:31-309`; `src/components/profile/general/security-page.tsx` | Clerk-backed authentication is present; policy and all authentication flows need manual review. |
| V2.2.1 — anti-automation and credential-stuffing protections | Needs-review | `src/lib/auth/secret-comparison.ts`; `src/lib/auth/cron-access.ts:1-39` | Secret comparison and bearer checks are tested, but application-wide rate-limit evidence is incomplete. |
| V3.2.1 — session lifecycle and logout | Needs-review | `src/middleware.ts:31-309` | Authentication routing is evidenced; session expiry, revocation, and logout coverage need review. |
| V4.1.1 — application-level access control | Needs-review | `src/app/api/permission/route.ts:1-96`; `tests/ren-104-boundaries.test.ts:1-90` | Permission boundary evidence exists; all protected routes are not covered by one complete matrix. |
| V4.2.1 — server-side ownership enforcement | Needs-review | `src/app/api/corporate-orders/[id]/vendor-po.pdf/route.tsx:51-102`; `src/lib/auth/logistics-access.ts:43-110` | Representative ownership checks exist; systematic resource-by-resource IDOR evidence is tracked separately. |
| V5.1.1 — input validation and encoding | Needs-review | `src/app/api/account-merge/route.ts:36-52`; `src/app/api/support/intake/route.ts:25-45` | Zod validation is present on representative APIs; complete endpoint coverage is pending. |
| V5.3.1 — output encoding and injection resistance | Needs-review | `src/app/api/support/intake/route.ts:25-203` | Input boundaries are visible, but a complete injection test set is not available in this matrix. |
| V7.1.1 — error handling does not leak sensitive data | Needs-review | `src/lib/fb-capi.ts`; `src/lib/auth/cron-access.ts:1-39` | Bounded error paths exist; a full production-log review is required. |
| V7.4.1 — security event logging | Needs-review | `src/lib/db/queries/audit-log.ts`; `src/lib/finance/audit.ts` | Audit logging code exists; retention, alerting, and event completeness need review. |
| V8.3.1 — sensitive data protection at rest | Needs-review | `src/lib/db/queries/audit-log.ts`; `src/lib/fb-capi.ts` | Data paths exist, but encryption, retention, and field-level handling are not fully evidenced here. |
| V9.1.1 — secure communications | Needs-review | `src/lib/delhivery/client.ts` | External-client code exists; endpoint/TLS configuration needs deployment verification. |
| V12.1.1 — secure file handling | Needs-review | `src/app/api/invoices/[orderId]/download/route.tsx`; `src/app/api/corporate-orders/[id]/summary.pdf/route.tsx` | Authenticated download routes are present; full file authorization and content validation need review. |
| V13.1.1 — API authentication and authorization | Needs-review | `src/app/api/finance/tds/export/route.ts:15`; `src/app/api/permission/route.ts:21-96` | Auth checks are evidenced on representative APIs; complete API inventory review remains required. |
| V13.2.1 — API input validation and business limits | Needs-review | `src/app/api/account-merge/route.ts:36-52`; `src/app/api/admin/monitoring-sla/incidents/route.ts:9-24` | Schemas and bounds are present on representative endpoints; all APIs need coverage. |
| V14.2.1 — dependency and configuration security | Needs-review | `tests/ren-105-client-boundaries.test.ts:1-19`; `docs/enhancement-improvements/execution-readiness/24-CURRENT_PROJECT_STATUS.md` | Boundary and readiness evidence exists; dependency/configuration inventory and live settings need review. |

## Evidence status summary

| Status | Count | Meaning |
|---|---:|---|
| Pass | 0 | No broad ASVS control is marked fully passed from this bounded review. |
| Fail | 0 | This matrix does not assert a control failure without sufficient evidence. |
| N/A | 0 | Applicability was not rejected for the selected controls. |
| Needs-review | 16 | Evidence is partial, representative, or requires manual/deployment verification. |

## Open evidence work

- Build a complete endpoint inventory and map each protected route to an authorization test.
- Complete the systematic IDOR matrix and attach reproducible results.
- Review production configuration, dependency versions, TLS, logging retention, and secret handling.
- Add or link automated tests where the current evidence is only a source citation.
- Reconcile this matrix into the CC6/CC7 crosswalk in REN-126 after review.
