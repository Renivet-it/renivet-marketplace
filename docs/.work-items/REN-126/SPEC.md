# REN-126 — Cross-map evidence to SOC 2 CC6/CC7

## Scope

Create one engineering-scope crosswalk from the complete OWASP ASVS 5.0.0 Level 2 matrix (all 253 Level 1/2 requirements) to SOC 2 Common Criteria CC6 and CC7. The document must identify the evidence source, coverage status, and gaps without claiming policy, vendor, HR, audit-attestation, or full SOC 2 readiness.

## Current finding

The corrected REN-125 branch contains the complete ASVS 5.0.0 Level 2 population. REN-126 must preserve its two confirmed failures and 251 `Needs-review` statuses rather than upgrading incomplete evidence.

## Required output

- A task-local crosswalk document under `docs/` with one row per applicable ASVS evidence item.
- Separate CC6 and CC7 mappings, with evidence links and Pass / Partial / Gap / Not applicable status.
- Explicit engineering-only scope and exclusions.
- A gap and follow-up section that distinguishes missing evidence from failed controls.
- Source references that are stable, reviewable, and do not contain secrets or personal data.

## Acceptance criteria

1. Every mapped row traces to an ASVS control-matrix item and a repository or approved evidence source.
2. CC6 and CC7 are mapped separately; unrelated SOC 2 criteria are excluded.
3. No unsupported compliance conclusion, legal interpretation, or full-readiness claim is added.
4. Missing REN-125 evidence is reported as pending, not silently treated as pass.
5. The document contains no credentials, tokens, secret values, or unnecessary customer data.
6. A reviewer can reproduce each mapping from the cited source.

## Verification

- Validate the work-item contract.
- Review every crosswalk row for source traceability and scope correctness.
- Check that all cited paths exist and contain no secrets.
- Confirm the document remains documentation-only and does not modify application behavior.

## Decision

`BLOCKED` pending the REN-125 ASVS control matrix or explicit approval to produce a pending-only crosswalk with no control-status claims.
