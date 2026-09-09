# REN-125 Critic review

Review mode: fresh-context, read-only contract review.

## Findings

- `CRIT-125-R01` — MAJOR — The task must define how missing evidence is represented; the contract now requires `Needs-review` rather than inferring a pass.
- `CRIT-125-R02` — MAJOR — A control matrix can be mistaken for certification. The engineering-only scope and exclusions are explicit.
- `CRIT-125-R03` — MAJOR — Security-sensitive controls need reproducible test or file/line evidence and visible open findings.
- `CRIT-125-R04` — MINOR — The completed artifact needs a secret and unnecessary-data scan.

All findings are reflected in the contract. No application code or production behavior is changed during specification.
