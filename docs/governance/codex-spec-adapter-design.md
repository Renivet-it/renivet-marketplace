# Renivet Codex `/SPEC` Adapter Design

The repository-native adapter is `.agents/skills/renivet-spec`, invoked as `$renivet-spec <Linear-ID>`. It retrieves Linear through the supported connector, progressively investigates the repository, emits branch-local `docs/.work-items/<ID>/` contracts, and never modifies application behavior.

`work-item.yaml` is the authoritative SPEC-to-TEST contract. A standalone deterministic validator checks schema, allowed states, risk arithmetic/floors, stable references, decisions, approval, and test expectations. One advisory pull-request workflow calls the validator without duplicating business rules or altering branch protection.

L2/L3 work receives an isolated read-only Critic. The approval gate fails closed for unresolved consequential decisions, blockers, incomplete traceability, inconsistent risk, or missing test expectations. The REN-95 pilot is governance-only and must stop before implementation.

Lifecycle: **SPEC** records and approves the implementation contract, **REVIEW** reconciles an implementation diff against that approved contract and records drift, and **TEST** executes the applicable verification separately; REVIEW never represents unexecuted tests as evidence.
