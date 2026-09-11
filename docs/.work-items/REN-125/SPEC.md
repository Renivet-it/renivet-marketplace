# REN-125 — Build OWASP ASVS L2 control matrix with evidence

## Scope

Create an engineering evidence matrix against the stable OWASP ASVS 5.0.0 Level 2 profile. Level 2 includes every requirement whose official level is 1 or 2: 253 requirements in the published CSV. Each row must contain the exact official control reference and statement, status (`Pass`, `Fail`, `N/A`, or `Needs-review`), and reproducible evidence or an explicit reason evidence is not yet sufficient.

This is an engineering evidence document only. It is not a legal opinion, audit opinion, certification, or claim of full SOC 2 readiness.

## Evidence rules

- Use only evidence present in the repository or explicitly recorded approved test artifacts.
- A missing test or citation is `Needs-review`, not `Pass`.
- `N/A` requires a short scope reason.
- Do not include credentials, tokens, secrets, or unnecessary personal data.
- Include all 253 requirements in the ASVS 5.0.0 Level 2 profile. Applicability is expressed row-by-row with `N/A` plus a reason, never by silently omitting a requirement.

## Acceptance criteria

1. All 253 ASVS 5.0.0 Level 1/2 requirements appear exactly once with one status and evidence or an explicit reason for `Needs-review`/`N/A`.
2. Evidence links to an automated test or stable repository path and line reference.
3. Authentication, authorization/IDOR, session, validation, error handling, data protection, logging, and configuration controls are considered.
4. Open findings remain visible and are not silently downgraded.
5. The document states engineering-only scope and excludes policy, vendor, HR, physical-facility, and audit-attestation controls.
6. The result is suitable as the source matrix for REN-126’s CC6/CC7 mapping.

## Verification

- Review the matrix for complete columns, unique control IDs, reproducible evidence, and correct status semantics.
- Check every cited path exists and line references are meaningful.
- Scan the document for secrets and unnecessary personal data.
- Validate the task contract.
