# Codex SPEC implementation report

## 1. Repository audit

The repository was inspected before implementation for governance documents, AI instructions, skills, schemas, validators, templates, GitHub workflows, package-manager configuration, Git state, Linear access, application structure, and tests. No checked-in Phase 1 governance schema, validator, Codex adapter, Claude skill, or GitHub workflow was present to extend. The repository already used Bun (`bun.lock`, Bun test files, and Bun scripts), so the adapter and validator use Bun. Application source and QA artifacts were treated as read-only.

## 2. Codex integration mechanism

Codex loads repository instructions from `AGENTS.md` and repository-local skills from `.agents/skills/<skill>/SKILL.md`. The adapter is the `renivet-spec` repository skill. Its supporting references separate workflow, Critic, and contract detail so the entry point stays concise. A fresh ephemeral Codex process opened at this repository reported that `renivet-spec` was available.

## 3. Linear integration mechanism

The workflow uses the supported Linear connector available to Codex. It does not store credentials. The real pilot retrieved REN-95 directly, including ID, title, description, priority, labels, status, assignee/project context, and expected Linear branch; the connector returned no comments for the issue.

## 4. One-time developer setup

1. Connect/authorize the Linear connector once in Codex with read access to the Renivet workspace.
2. Clone the repository and run `bun install --frozen-lockfile`.
3. Open the repository root in Codex so `AGENTS.md` and `.agents/skills` are discovered.

No repository credential or per-task credential setup is required.

## 5. /SPEC invocation method

Codex does not expose a repository-defined custom slash command for this adapter. The supported invocation is:

```text
$renivet-spec REN-95
```

This is the closest supported equivalent to `/SPEC REN-95`. The developer supplies only the Linear ID.

## 6. Files created

- `AGENTS.md`
- `.agents/skills/renivet-spec/SKILL.md`
- `.agents/skills/renivet-spec/agents/openai.yaml`
- `.agents/skills/renivet-spec/references/{governance-workflow,critic,work-item-contract}.md`
- `docs/governance/codex-spec-adapter-design.md`
- `scripts/governance/{work-item-schema,validate-work-item,validate-work-item.test}.ts`
- `scripts/governance/fixtures/{valid-l2,invalid-risk,invalid-traceability}/work-item.yaml`
- `.github/workflows/governance.yml`
- `CODEX_SPEC_IMPLEMENTATION_REPORT.md`

The REN-95 pilot artifacts were created and validated locally under `docs/.work-items/REN-95/`, but are deliberately excluded from this reusable-adapter PR because work items are branch-local and temporary.

## 7. Files modified

- `package.json`: added `governance:validate` and pinned `yaml` as a development dependency.
- `bun.lock`: updated by Bun for `yaml@2.6.0`.
- `.gitignore` on the source branch: added `/.worktrees/` before creating the isolated worktree.

No file under `src/`, no database schema/migration, no production configuration/data, no application test, and no QA artifact was modified.

## 8. Existing artifacts reused

The implementation reused Bun and the existing package/test conventions. No existing Renivet Phase 1 governance artifacts were found, so no competing schema or second adapter was created. The implementation uses Codex's supported repository-instruction/skill system and the installed Linear connector rather than emulating either mechanism.

## 9. Work-item schema

`schema_version: "1.0"` defines task metadata/state, four-input risk arithmetic, progressive investigation, stable-ID collections, decisions, test expectations, three traceability maps, Critic state/findings, and approval state. An optional implementation-review section records `NO_DRIFT`, `MINOR_DRIFT`, or `MATERIAL_DRIFT`, diff evidence, and the governance re-entry flag.

The Bun validator checks YAML readability, required structure, lifecycle states, `MAX(initial, path-rule, semantic)` risk, ID prefixes/duplicates, reference integrity, coverage links, test classifications/reasons, high-consequence confirmation, L2/L3 Critic completion, READY approval/dependencies/blockers, CI branch consistency, and material-drift re-entry.

## 10. SPEC -> TEST contract

`work-item.yaml` is authoritative and consumable without scraping Markdown. It provides stable requirement, scenario, invariant, flow, dependency, integration, persona, boundary, rule, decision, and test-expectation IDs plus requirement-to-scenario, scenario-to-invariant, and scenario-to-test-expectation relationships. Markdown files provide human-readable depth but are not the only location of material test information.

## 11. Intelligent Decision Engine

The skill defines `AUTO_DECIDE`, `RECOMMEND_CONTINUE`, and `HUMAN_CONFIRMATION`. Each consequential pilot decision records the question, recommendation, confidence, consequence, status, and human-confirmation flag. High consequence overrides confidence. REN-95 contains six unresolved Class C decisions rather than fabricated product policy.

## 12. Risk model

The adapter preserves L0-L3 and computes `final_risk = MAX(initial_risk, path_rule_risk, semantic_risk)`. L0 creates no work item; L1 uses targeted lightweight governance; L2 requires structured/dependency-driven design; L3 requires broad impact analysis. Evidence may escalate but never lower risk. REN-95 escalated from L2 to L3 after payment, identity, PII, schema, inventory, order, and integration impact was confirmed.

## 13. Critic architecture

L2/L3 requires a fresh-context, read-only Critic that receives the issue, written artifacts, and repository evidence but not private Architect reasoning. The REN-95 Critic ran in a separate isolated agent, edited no files, and produced 18 auditable findings. The Architect incorporated the findings into requirements, scenarios, invariants, flows, architecture, tests, decisions, blockers, and `CRITIQUE.md`.

## 14. Approval Gate

The deterministic gate fails closed. `READY_FOR_DEV` requires `APPROVED`, no design blockers, no unresolved human-confirmation decisions, all dependencies resolved, valid traceability/risk/test expectations, and a completed L2/L3 Critic. Material implementation drift also invalidates READY and requires governance re-entry.

REN-95 is correctly `BLOCKED`, not `READY_FOR_DEV`, because six product/finance/security decisions, seven dependencies, and four Critic design blockers remain unresolved.

## 15. Git workflow

Governance implementation was isolated in worktree `.worktrees/renivet-spec-governance` on branch `codex/renivet-spec-governance`. The pilot records both that actual branch and Linear's expected task branch, making the mismatch visible rather than silently claiming compliance. Normal usage creates the work item on the task feature branch, validates it before PR, and carries it through review.

## 16. Temporary work-item lifecycle

Task-specific artifacts live only in `docs/.work-items/<LINEAR-ID>/` on the feature branch. They travel with development and the PR, are validated in CI, and should be removed before/default-branch integration so task documentation does not accumulate on the default branch. Git/PR history remains the audit record.

## 17. GitHub CI handoff

`.github/workflows/governance.yml` runs on pull requests with read-only contents permission, Bun 1.2.14, a frozen install, focused validator tests, and validation of every changed `docs/.work-items/*/work-item.yaml`. GitHub YAML contains no semantic AI logic. The check is advisory until a repository administrator explicitly makes `Validate governance contracts` a required status check; branch protection was not changed.

## 18. Validation results

| ID       | Result | Executed evidence                                                                                                            |
| -------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| SPEC-001 | PASS   | Fresh ephemeral Codex process discovered `renivet-spec` and returned `$renivet-spec <LINEAR-ID>`.                            |
| SPEC-002 | PASS   | Linear connector retrieved real issue REN-95 without pasted issue content.                                                   |
| SPEC-003 | PASS   | `docs/.work-items/REN-95/` and its contract/artifacts were created by the pilot.                                             |
| SPEC-004 | PASS   | REN-95 records targeted entry paths, progressively expanded callers/data/integrations/tests, exclusions, and reasons.        |
| SPEC-005 | PASS   | Valid fixture and REN-95 pass deterministic four-input risk validation.                                                      |
| SPEC-006 | PASS   | Invalid-risk fixture produces `GOV-RISK-001`; REN-95 records L2 -> L3 evidence.                                              |
| SPEC-007 | PASS   | REN-95 has unique `REQ-001` through `REQ-013`; validator enforces prefixes/duplicates.                                       |
| SPEC-008 | PASS   | REN-95 has unique `SCN-001` through `SCN-019`; validator enforces prefixes/duplicates.                                       |
| SPEC-009 | PASS   | REN-95 has unique `INV-001` through `INV-012`; validator enforces prefixes/duplicates.                                       |
| SPEC-010 | PASS   | Validator rejects the invalid traceability fixture; REN-95 maps every requirement to scenarios.                              |
| SPEC-011 | PASS   | REN-95 maps each scenario to applicable invariants using validated references.                                               |
| SPEC-012 | PASS   | REN-95 classifies 12 task-specific test categories with reasons and scenario links.                                          |
| SPEC-013 | PASS   | `bun run governance:validate -- docs/.work-items/REN-95/work-item.yaml` exits 0.                                             |
| SPEC-014 | PASS   | Fresh-context read-only Critic executed for real L3 pilot and recorded 18 findings.                                          |
| SPEC-015 | PASS   | Bun test proves unresolved required decisions produce `GOV-APPROVAL-001`.                                                    |
| SPEC-016 | PASS   | Bun test proves incomplete L2 Critic produces `GOV-CRITIC-001`; schema/ID/test omissions also fail closed.                   |
| SPEC-017 | PASS   | Complete READY L2 fixture passes; unresolved decisions, Critic, dependencies, blockers, or approval state cannot pass READY. |
| SPEC-018 | PASS   | Bun test proves `MATERIAL_DRIFT` on READY produces `GOV-DRIFT-001` and requires re-entry.                                    |
| SPEC-019 | PASS   | Skill defines no work item for L0; Bun test proves L1 does not inherit the L2/L3 Critic gate.                                |
| SPEC-020 | PASS   | Real L3 pilot produced full requirements, scenarios, invariants, flows, architecture, Critic, tests, and approval analysis.  |
| SPEC-021 | PASS   | REN-95 decisions include recommendation, confidence, consequence, and confirmation requirement.                              |
| SPEC-022 | PASS   | Bun test proves a high-consequence decision without human confirmation produces `GOV-DECISION-001`.                          |
| SPEC-023 | PASS   | The same test sets confidence to high and still fails because consequence is high.                                           |
| SPEC-024 | PASS   | Validator consumes `work-item.yaml` directly; valid fixture and REN-95 validate independently of Markdown.                   |

Local pilot verification evidence (not part of this PR): `bun test` passed 35 tests across 11 files with 0 failures; the focused governance suite ultimately passed 15 tests; REN-95 and the valid L2 fixture exited 0; the risk and traceability fixtures each exited 1 with `GOV-RISK-001` and `GOV-TRACE-001`; Prettier and skill-package validation exited 0; and the Git scope check found no changes under `src/`, `qa/`, `drizzle/`, or `migrations/`.

## 19. Pilot results

Pilot issue: REN-95, “Checkout login wall blocks guest checkout — three-layer fix needed.” Linear intake and progressive repository investigation completed without implementing the issue. The resulting L3 contract contains 13 requirements, 19 scenarios, 12 invariants, three state-machine flows, six decisions, 12 test expectations, six integrations, four security boundaries, and 18 Critic findings.

Pilot outcome: **BLOCKED**. This is the required safe outcome, not a fabricated pass. It cannot reach `READY_FOR_DEV` until the guest principal, proof/PII policy, payment cardinality/atomicity/refund policy, COD policy, account-linking policy, coupon policy, dependencies, and Critic design blockers are resolved and approved.

## 20. Known limitations

- Codex's supported repository skill syntax is `$renivet-spec`, not a custom `/SPEC` slash alias.
- The GitHub workflow has been locally inspected/formatted and exercises the locally tested validator, but no remote PR run was created in this task.
- The pilot used the governance implementation branch rather than Linear's expected REN-95 feature branch; the mismatch is explicitly recorded.
- Semantic completeness, architecture quality, and decision recommendations remain AI/human responsibilities; CI intentionally validates only deterministic properties.
- Implementation drift can be recorded and gated, but no REN-95 implementation exists to compare because the pilot was prohibited from implementing it.

## 21. Human configuration required

- Keep the Linear connector authorized for developers who invoke the skill.
- A product/security/finance owner must resolve DEC-001 through DEC-006 and the associated pilot blockers before REN-95 can proceed.
- A repository administrator may later make `Validate governance contracts` a required status check after observing it on real PRs. No branch-protection change is required for the advisory phase.
- The team must enforce removal of branch-local `docs/.work-items/<ID>/` artifacts before/default-branch merge according to the chosen PR cleanup convention.

## 22. Recommended next step

Review and approve the repository-governance changes, then resolve REN-95's six Class C decisions with product/security/finance owners. After updating the contract and clearing the deterministic gate on the actual REN-95 feature branch, use the approved specification for implementation and run implementation-review mode against the Git diff before opening the PR.
