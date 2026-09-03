# State Machine — Ingestion Lifecycle (P08 V1)

Covers the File-First batch lifecycle: ingest → parse → map → validate → dry-run → approve → write → (reconcile is Phase 2, shown as a future state only). Explicit error/hold states are first-class, not exceptions.

```mermaid
stateDiagram-v2
    [*] --> Uploaded
    Uploaded --> Parsing
    Parsing --> ParseFailed: malformed/corrupt file
    ParseFailed --> [*]

    Parsing --> Mapping
    Mapping --> MappingHeld: ambiguous column, no confident deterministic match
    MappingHeld --> Mapping: human confirms/corrects
    Mapping --> SchemaDriftHeld: expected column missing/renamed
    SchemaDriftHeld --> [*]: hard-fail, no partial write
    Mapping --> Normalizing

    Normalizing --> NormalizationHeld: attribute value unresolved by lookup+AI
    NormalizationHeld --> Normalizing: human confirms/corrects
    Normalizing --> IdentityResolving

    IdentityResolving --> IdentityHeld: no exact match (unknown SKU)
    IdentityHeld --> CandidateQueued: AI suggests fuzzy candidates
    CandidateQueued --> IdentityResolving: human confirms candidate
    CandidateQueued --> IdentityHeld: human rejects candidate
    IdentityResolving --> Validating

    Validating --> ValidationFailedRow: row-level failure (bad range, cross-tenant, missing required field)
    ValidationFailedRow --> Validating: excluded from this row onward, batch continues
    Validating --> DryRun

    DryRun --> AwaitingApproval
    AwaitingApproval --> Rejected: brand declines
    Rejected --> [*]
    AwaitingApproval --> Writing: brand approves

    Writing --> PartiallyFailed: some rows fail at write time
    PartiallyFailed --> Logged
    Writing --> Written
    Written --> Logged
    Logged --> [*]

    Logged --> Reconciling: (Phase 2, gated — not built in V1)
```

## Hold states are terminal-per-row, not batch-blocking

`MappingHeld`, `NormalizationHeld`, `IdentityHeld`, `CandidateQueued`, and `ValidationFailedRow` isolate the affected row(s) without blocking the rest of the batch — this directly implements FR-16/NFR-3 (per-item isolation) and closes the current-state gap where one bad SKU can block or silently drop an entire brand's batch. (Research: `06-sync-and-reconciliation/` Failure Handling.)

## Explicit non-states in V1

There is no `Reconciling` state reachable in V1 — it is shown above only to mark where Phase 2's reconciliation spine would attach once its trigger fires (a second live source per brand). There is no auto-apply transition out of `IdentityHeld` or `CandidateQueued` — every exit from those states requires a human action, per BRule-1.
