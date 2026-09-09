# SOC 2 CC6/CC7 engineering evidence crosswalk

Date: 2026-09-10

## Scope and limitation

This is an engineering evidence crosswalk from the reviewed [ASVS L2 matrix](ASVS-L2-CONTROL-MATRIX.md) to the logical themes of SOC 2 CC6 and CC7. It is not a SOC 2 report, audit opinion, certification, legal interpretation, or full readiness assessment. It excludes policy, vendor, HR, physical-facility, and auditor-attestation controls. The statuses below preserve the source matrix’s `Needs-review` status and do not establish control effectiveness.

## CC6 — logical and physical access controls

| SOC 2 theme | ASVS source | Engineering evidence | Status | Gap / follow-up |
|---|---|---|---|---|
| CC6.1 — logical access boundaries | V1.2.1, V4.1.1 | `src/middleware.ts:1-309`; `tests/ren-104-boundaries.test.ts:1-90` | Needs-review | Complete route inventory and authorization review. |
| CC6.2 — authentication controls | V2.1.1, V2.2.1, V3.2.1 | `src/middleware.ts:31-309`; `src/lib/auth/secret-comparison.ts`; `src/lib/auth/cron-access.ts:1-39` | Needs-review | Verify authentication policy, session lifecycle, and anti-automation coverage. |
| CC6.3 — authorization and least privilege | V4.1.1, V4.2.1 | `src/app/api/permission/route.ts:1-96`; `src/lib/auth/logistics-access.ts:43-110` | Needs-review | Complete owner/role/tenant and IDOR test matrix. |
| CC6.6 — logical access removal and lifecycle | V3.2.1, V4.1.1 | `src/middleware.ts:31-309`; `src/app/api/account-merge/route.ts:262-361` | Needs-review | Verify revocation, account lifecycle, and post-change access behavior. |
| CC6.7 — transmission and access protection | V9.1.1, V13.1.1 | `src/lib/delhivery/client.ts`; `src/app/api/finance/tds/export/route.ts:15` | Needs-review | Confirm deployed TLS, API authentication, and route coverage. |

## CC7 — system operations

| SOC 2 theme | ASVS source | Engineering evidence | Status | Gap / follow-up |
|---|---|---|---|---|
| CC7.1 — detect and monitor security events | V7.4.1 | `src/lib/db/queries/audit-log.ts`; `src/lib/finance/audit.ts` | Needs-review | Verify event completeness, retention, alerting, and operational ownership. |
| CC7.2 — monitor anomalies and failures | V7.1.1, V7.4.1 | `src/lib/fb-capi.ts`; `src/lib/db/queries/audit-log.ts` | Needs-review | Review production logs and monitoring response evidence. |
| CC7.3 — evaluate and respond to issues | V5.1.1, V7.1.1, V13.2.1 | `src/app/api/account-merge/route.ts:36-52`; `src/app/api/admin/monitoring-sla/incidents/route.ts:9-24` | Needs-review | Attach incident-response and validation evidence where available. |
| CC7.4 — recover from identified issues | V1.2.1, V14.2.1 | `docs/enhancement-improvements/execution-readiness/24-CURRENT_PROJECT_STATUS.md` | Needs-review | Add reproducible recovery, rollback, and dependency-response evidence. |
| CC7.5 — change and configuration monitoring | V14.2.1 | `tests/ren-105-client-boundaries.test.ts:1-19`; `docs/enhancement-improvements/execution-readiness/24-CURRENT_PROJECT_STATUS.md` | Needs-review | Complete dependency/configuration inventory and deployment evidence. |

## Reconciliation

- Source: REN-125’s reviewed ASVS L2 matrix.
- Source status: all 16 selected ASVS areas remain `Needs-review`.
- Crosswalk status: all mappings remain `Needs-review`; no SOC 2 control is marked Pass.
- Missing evidence is reported as a gap, not as a failed control or an implied pass.
- The crosswalk covers only engineering evidence relevant to CC6 and CC7.

## Required follow-up

1. Complete the ASVS and IDOR evidence work and update the source matrix.
2. Verify production configuration, access lifecycle, logging, monitoring, incident response, recovery, and change control.
3. Have an appropriate security/compliance stakeholder review the mapping terminology before using it in any formal assessment.
