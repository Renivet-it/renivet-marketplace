# REN-229 — Commission Rules Data Integrity / Foundation

Status: `BLOCKED` pending confirmation of two Class C decisions.

## Scope and risk

REN-229 adds database integrity controls around the existing, currently empty `commission_rules` table. It does not populate rules, alter commission calculation, or change payout amounts. The change is still L3 because it changes financial configuration integrity and the schema used by future payout-rule consumers.

Repository evidence:

- `drizzle/0248_finance_compliance_runtime.sql:65-80` creates `commission_rules` with only its primary key.
- `src/lib/db/schema/finance-compliance.ts:212-246` declares only a brand relation in the application schema and two indexes, but those statements were not emitted by the migration; category and product-type relations are absent.
- `src/lib/finance/payouts.ts:123-151,281-295` reads commission rules and performs payout arithmetic. This task must leave that resolver and arithmetic unchanged.
- Linear’s reverified evidence says the table has zero rows and no additional live constraints or indexes.

## Requirements

- **REQ-229-001:** Add nullable-safe foreign keys from `commission_rules.brand_id`, `category_id`, and `product_type_id` to their authoritative tables, with an explicitly selected `ON DELETE` action.
- **REQ-229-002:** Add the named `commission_rules_brand_idx` and `commission_rules_priority_idx` indexes; an additional category lookup index may be added only if justified by the implementation plan.
- **REQ-229-003:** Prevent overlapping effective-date ranges for active rules with the same nullable scope, while preserving `NULL` brand wildcard/category-only rules.
- **REQ-229-004:** Keep this change additive and data-preserving: insert no commission rules, change no category rates, and leave payout calculation/resolution behavior unchanged.
- **REQ-229-005:** Provide database/integration evidence for FK violations, overlap rejection, allowed non-overlap/inactive cases, wildcard insertion, rollback, and the unchanged empty table.
- **REQ-229-006:** Keep the Drizzle TypeScript schema and emitted migration synchronized, including the selected FK actions and named indexes.
- **REQ-229-007:** Reject invalid effective ranges where `effective_from > effective_to`; treat null endpoints as open bounds and date intervals as inclusive unless the confirmed decision says otherwise.
- **REQ-229-008:** Define migration transactionality, rerun/idempotency behavior, partial-failure recovery, and the repository-compatible rollback procedure.

## Scenarios and invariants

- **SCN-229-001:** A rule referencing a nonexistent brand, category, or product type is rejected by the database. (REQ-229-001, REQ-229-005)
- **SCN-229-002:** Two active rules with identical scope and overlapping effective ranges are rejected; non-overlapping ranges succeed. (REQ-229-003, REQ-229-005)
- **SCN-229-003:** An inactive overlapping rule succeeds, and a rule with `brand_id=NULL` and a real category succeeds. (REQ-229-003, REQ-229-005)
- **SCN-229-004:** Migration inspection shows the required constraints/indexes and rollback removes only REN-229 objects. (REQ-229-001, REQ-229-002, REQ-229-004, REQ-229-005)
- **SCN-229-005:** After migration, `commission_rules` remains empty and `payouts.ts` calculation/resolver behavior is unchanged. (REQ-229-004, REQ-229-005)
- **SCN-229-006:** Valid existing scope references are accepted; an invalid date range is rejected; open-ended ranges use the defined inclusive/open-bound semantics. (REQ-229-001, REQ-229-003, REQ-229-007)
- **SCN-229-007:** A concurrent conflicting write cannot create two invalid active overlapping rules, and rerunning or partially failing the migration follows the documented recovery path. (REQ-229-005, REQ-229-008)

- **INV-229-001:** Every non-null scope identifier in a commission rule resolves to an existing authoritative row.
- **INV-229-002:** Active identical scopes cannot have intersecting effective-date ranges; inactive rules do not participate.
- **INV-229-003:** Null scope dimensions retain existing wildcard semantics and are never widened by deletion behavior without an explicit policy.
- **INV-229-004:** REN-229 cannot create, update, delete, or rewrite production commission data.
- **INV-229-005:** No payout amount, category commission rate, resolver ordering, or payout state transition changes under this task.
- **INV-229-006:** The generated migration and Drizzle schema express the same constraints, indexes, and delete actions.
- **INV-229-007:** Overlap enforcement is atomic at the database boundary and cannot be bypassed by concurrent writers.

## Architecture and flow

- **FLOW-229-001:** Migration -> add explicit nullable-safe FKs -> add required lookup indexes -> add confirmed overlap guard -> validate catalog/constraint metadata.
- **FLOW-229-002:** Rule write -> FK validation -> active/date/scope overlap validation -> commit or reject atomically.
- **FLOW-229-003:** Rollback -> drop overlap guard, indexes, and FKs -> restore current empty-table shape without changing unrelated schema.
- **FLOW-229-004:** Migration failure -> transaction rollback or documented forward-only repair -> verified metadata state; rerun is safe according to the selected migration convention.

The preferred enforcement architecture is a database-level guard, optionally paired with an application pre-check for clearer errors. The implementation must handle `NULL` as wildcard explicitly; a naïve PostgreSQL exclusion constraint does not automatically model `NULL = wildcard`. If that cannot be expressed safely in the selected migration approach, the implementation must return to the decision gate rather than silently weakening integrity to an application-only check.

## Decisions and blockers

- **DEC-229-001 (HUMAN_CONFIRMATION):** Select `ON DELETE` behavior for brand, category, and product type. Recommendation: `RESTRICT`/`NO ACTION` for financial correctness, avoiding silent wildcard widening (`SET NULL`) and rule loss (`CASCADE`). Product-type behavior remains open for the same reason.
- **DEC-229-002 (HUMAN_CONFIRMATION):** Select overlap enforcement. Recommendation: a DB-enforced guard plus an application pre-check if practical; confirm the extension/range/NULL strategy before migration authoring. Application-only validation is bypassable by direct SQL and is not sufficient as the sole integrity control.

Until DEC-229-001 and DEC-229-002 are confirmed, approval is blocked. No schema or application implementation may begin.

## Independent Critic review

The fresh-context, read-only Critic reviewed all required categories. Findings are recorded in `CRITIQUE.md` and the machine-readable contract. `CRIT-229-001` and `CRIT-229-002` remain design blockers; the remaining findings are open implementation-contract gaps that must be addressed before approval.

Additional required clarifications are: define the exact wildcard/date interval semantics; reject invalid ranges; specify database-level concurrency protection; synchronize Drizzle schema with SQL; document forward-only rollback/recovery and rerun behavior; add positive FK coverage; and define bounded constraint-error observability.

## Dependencies, boundaries, and tests

- **DEP-229-001:** Existing `commission_rules` schema and migration; resolved through repository inspection.
- **DEP-229-002:** `brands`, `categories`, and `product_types` tables; required FK targets and migration ordering.
- **DEP-229-003:** REN-203 commission resolver/unit fix; related but explicitly unchanged here.
- **DEP-229-004:** REN-209 commercial configuration and future rule population; blocked until this foundation is approved.

Security boundary: migration execution and validation require authorized database deployment access; tests must use disposable/controlled data and must not expose customer or payment data. Observability should expose migration success/failure and constraint names without logging rule financial values.

Required tests: integration tests for all FK failures, identical-scope overlap, boundary-touching dates, non-overlap, inactive overlap, wildcard scope, concurrent conflicting writes, rollback, and zero-row preservation; regression checks that `payouts.ts`, category rates, and resolver behavior are unchanged. An `EXPLAIN` check for the new indexes is optional.
