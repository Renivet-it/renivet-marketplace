# REN-125 — Build OWASP ASVS L2 control matrix with evidence

## Scope

Create an engineering evidence matrix for relevant OWASP ASVS Level 2 controls. Each row must contain the ASVS control reference, a concise control statement, status (`Pass`, `Fail`, `N/A`, or `Needs-review`), and reproducible evidence using an automated test or a repository file/line citation.

This is an engineering evidence document only. It is not a legal opinion, audit opinion, certification, or claim of full SOC 2 readiness.

## Evidence rules

- Use only evidence present in the repository or explicitly recorded approved test artifacts.
- A missing test or citation is `Needs-review`, not `Pass`.
- `N/A` requires a short scope reason.
- Do not include credentials, tokens, secrets, or unnecessary personal data.
- Keep the matrix focused on relevant ASVS L2 controls for the Renivet application; do not pretend every ASVS control is applicable.

## Acceptance criteria

1. Every relevant selected control has exactly one status and evidence or an explicit reason for `Needs-review`/`N/A`.
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
