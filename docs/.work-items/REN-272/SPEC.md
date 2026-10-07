# REN-272 Specification

## Goal

Reconcile Corporate database invariants with the repository and restore a safe, repeatable non-production staging validation path.

## Scope

Audit and add only additive, reversible constraints required by REN-262, REN-265, REN-269, REN-270, and REN-271. Audit duplicates before uniqueness changes, record pre/post metadata, and prove staging uses non-production dependencies and a named commit.

## Architecture

Repository migrations remain authoritative. A deterministic audit identifies duplicate rows before constraints are applied. Staging readiness is a validation contract containing deployment SHA, database identity class, provider mode, migration result, rollback reference, and secret-safe evidence.

## Decisions

- Uniqueness changes are additive and fail closed when duplicate data exists; no automatic destructive deduplication.
- Staging evidence must use non-production database/provider configuration and must never persist secrets.

## Acceptance

Required metadata matches repository declarations, duplicate audits are explicit, migrations are reversible/documented, and staging produces a READY deployment for a named SHA with non-production dependencies.

## Test matrix

Duplicate audit, migration registration, metadata comparison, rollback/snapshot evidence, deployment SHA evidence, non-production configuration, and secret-safe output.
