# SOC 2 CC6/CC7 engineering evidence crosswalk

Source baseline: OWASP ASVS 5.0.0 Level 2 matrix (253 Level 1/2 requirements).

This is engineering evidence only—not a SOC 2 audit, certification, legal opinion, or full-readiness claim. Policy, HR, vendor, physical-facility, and auditor-attestation controls are excluded.

| SOC 2 theme | ASVS 5.0 evidence groups | Result | Engineering conclusion |
|---|---|---|---|
| CC6.1 logical access controls | V6 Authentication, V7 Session Management, V8 Authorization | Needs-review | Representative server-side authorization tests pass, but complete route/session evidence is absent. |
| CC6.2 credential and identity lifecycle | V6, V7, V9 Self-contained Tokens, V10 OAuth/OIDC | Needs-review | Clerk integration exists; lifecycle, token rotation, revocation, and provider configuration need external evidence. |
| CC6.3 role, owner, and privileged access | V8 Authorization | Needs-review | Selected logistics and permission-policy paths are tested; full IDOR/role inventory is unfinished. |
| CC6.6 access removal | V7, V8, V10 | Needs-review | Account/session removal requires end-to-end and provider evidence. |
| CC6.7 transmission protection | V12 Secure Communication | **Fail** | V12.3.1 fails because hardcoded unencrypted outbound HTTP calls exist. |
| CC6.8 data and system boundary protection | V4 API, V5 File Handling, V11 Cryptography, V14 Data Protection | **Fail / Needs-review** | V5.2.1 fails due to upload settings allowing 9,999 files up to 1024GB; remaining controls need evidence. |
| CC7.1 vulnerability/configuration awareness | V13 Configuration, V15 Secure Coding and Architecture | Needs-review | Full dependency/configuration inventory and remediation evidence are absent. |
| CC7.2 security monitoring | V16 Security Logging and Error Handling | Needs-review | Audit components exist; coverage, retention, alerting, and sensitive-field handling need review. |
| CC7.3 incident analysis | V16 plus operational evidence | Needs-review | Incident endpoints exist, but complete triage/response evidence is absent. |
| CC7.4 response and recovery | V13, V15, V16 | Needs-review | Selected recovery boundaries exist; complete exercises and ownership evidence are absent. |
| CC7.5 change/remediation tracking | V15 plus repository governance | Needs-review | Work-item governance exists; remediation SLAs and dependency evidence remain incomplete. |

## Confirmed engineering failures

1. **ASVS V5.2.1 / CC6.8:** `src/app/api/uploadthing/core.ts:427-432` allows 9,999 files with a 1024GB limit.
2. **ASVS V12.3.1 / CC6.7:** `src/app/api/search/products/route.ts:5` and `src/lib/db/queries/product.ts:1239` use hardcoded unencrypted HTTP endpoints.

## Current totals

- ASVS requirements assessed: 253
- Pass: 0
- Fail: 2
- N/A: 0
- Needs-review: 251

No CC6 or CC7 theme is marked passed until all supporting ASVS requirements and organizational evidence are verified.
