# Governance workflow

## Risk

Use L0 for trivial non-behavioral work requiring no work item; L1 for contained low-risk behavior with targeted investigation; L2 for dependency-spanning or structured design work; and L3 for broad or high-consequence system impact.

Authentication, authorization, tenant isolation, customer identity/PII, payment, finance, inventory, order lifecycle, schema changes, destructive operations, security-sensitive APIs, and external integrations increase risk.

Set `final_risk` to the maximum of `initial_risk`, `path_rule_risk`, and `semantic_risk`. Evidence may raise risk. Never lower it below an input.

### Path rule risk

`path_rule_risk` is computed, not judged. `scripts/governance/risk-rules.yaml` maps path globs to risk domains and minimum levels; `compact-check risk` returns the highest matching level for the expected surface (SPEC) or for the real diff (REVIEW). Write the script's value into the contract. The AI may raise risk through `initial_risk` and `semantic_risk`, never lower the computed path rule. REVIEW recomputes it from the actual diff; a result above `final_risk` is material drift and re-enters governance.

### Investigation budget

| Level | Recorded files | Hops | Also                                                          |
| ----- | -------------- | ---- | ------------------------------------------------------------- |
| L1    | up to 8        | 1    | lightweight                                                   |
| L2    | up to 25       | 2    | targeted                                                      |
| L3    | up to 60       | 3    | every mandatory domain trace for the domains the surface hits |

The budget is bounded guidance and a lint of the scope recorded in the contract. It is not a live count of session reads and cannot be enforced while the session runs. Record `investigation.depth` as `L1_LIGHT`, `L2_TARGETED`, or `L3_DEEP`; record any overage as `investigation.budget_exception`. The values are initial and may be recalibrated.

### Critic by level

| Level | Critic                                                                                                                                                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L0    | none                                                                                                                                                                        |
| L1    | none                                                                                                                                                                        |
| L2    | one focused pass: the categories in `critic_focus` are examined in depth and every other required category gets a one-line evidence-based answer; no routine revision cycle |
| L3    | the full Critic, all required categories and cycles, unchanged                                                                                                              |

Independence is unchanged at every level: a separate, read-only, fresh-context agent that does not receive the Architect's reasoning.

## Design

Assign stable IDs to requirements (`REQ-*`), scenarios (`SCN-*`), invariants (`INV-*`), flows (`FLOW-*`), dependencies (`DEP-*`), integrations (`INT-*`), personas (`PER-*`), security boundaries (`SEC-*`), business rules (`BR-*`), decisions (`DEC-*`), and test expectations (`TEXP-*`).

Distinguish explicit and inferred requirements, assumptions, dependencies, design choices, and unresolved decisions. Cover applicable happy, alternate, negative, authorization, identity, retry, idempotency, concurrency, external-failure, state-transition, recovery, security, and regression scenarios.

## Decisions

- Class A (`AUTO_DECIDE`): low-risk, reversible, convention-supported. Record the basis.
- Class B (`RECOMMEND_CONTINUE`): strong evidence and manageable consequence. Record recommendation, basis, confidence, and impact.
- Class C (`HUMAN_CONFIRMATION`): financial behavior, irreversible data change, destructive production action, legal/compliance interpretation, security exception, breaking contract, major customer policy, or significant architectural trade-off. Record options and recommendation, then block the affected workflow.

High confidence never overrides high consequence.

## Approval gate

`READY_FOR_DEV` requires complete required requirements, scenarios, invariants, architecture, traceability, test expectations, dependency state, risk consistency, and L2/L3 Critic review. It also requires zero design blockers and zero unresolved decisions marked `human_confirmation_required`.
