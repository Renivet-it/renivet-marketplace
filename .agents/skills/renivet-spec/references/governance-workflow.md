# Governance workflow

## Risk

Use L0 for trivial non-behavioral work requiring no work item; L1 for contained low-risk behavior with targeted investigation; L2 for dependency-spanning or structured design work; and L3 for broad or high-consequence system impact.

Authentication, authorization, tenant isolation, customer identity/PII, payment, finance, inventory, order lifecycle, schema changes, destructive operations, security-sensitive APIs, and external integrations increase risk.

Set `final_risk` to the maximum of `initial_risk`, `path_rule_risk`, and `semantic_risk`. Evidence may raise risk. Never lower it below an input.

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
