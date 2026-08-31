# Data Flow — P08 (V1)

## File-First path

```mermaid
sequenceDiagram
    participant B as Brand operator
    participant UI as Upload UI (extended product-import.tsx)
    participant SM as Schema mapper
    participant VN as Value normalizer
    participant IR as Identity resolver (exact-match)
    participant VAL as Validator
    participant DR as Dry-run
    participant W as Write path
    participant DB as Renivet core tables
    participant LOG as Import log

    B->>UI: Upload file
    UI->>SM: Parsed rows + headers
    SM->>SM: Deterministic alias match
    SM-->>B: Ambiguous columns need confirmation (first time only)
    B-->>SM: Confirms/corrects mapping
    SM->>VN: Mapped rows
    VN->>VN: Per-brand lookup table match
    VN-->>B: Unresolved values need AI-assist confirmation
    VN->>IR: Normalized rows
    IR->>IR: Exact match against sku/barcode/title+attrs
    IR-->>LOG: Unmatched rows -> held queue (never guessed)
    IR->>VAL: Matched rows
    VAL->>VAL: Structural, brandId, range, cross-field checks
    VAL->>DR: Valid rows
    DR-->>B: Diff preview (matched/changed/new/removed/ambiguous/invalid)
    B-->>DR: Approves
    DR->>W: Approved rows
    W->>DB: Write with source + sourceRecordedAt
    W->>LOG: Per-batch outcome (succeeded/failed rows, IDs, timestamp)
```

## Existing Unicommerce path (unchanged except F10 fix)

```mermaid
sequenceDiagram
    participant Cron as Cron / manual trigger
    participant UC as Unicommerce API
    participant Sync as Sync handler
    participant DB as Renivet core tables

    Cron->>Sync: Trigger (per-brand)
    Sync->>UC: Fetch inventory (OAuth2, brand-scoped credentials)
    Sync->>Sync: syncInventoryBySku (exact match, brand-scoped)
    Sync->>DB: Transactional per-brand write
    Note over Sync,DB: F10 fix: every settings procedure verifies<br/>caller's own brandId server-side before this runs
```

## Provenance and audit data at rest

Every write from either path leaves: (1) a `source`/`sourceRecordedAt` pair on the affected row, and (2) for File-First, a per-batch log entry. This is the minimal provenance extension described in `06-data/DATA_REQUIREMENTS.md` — it is deliberately not the full reconciliation/audit spine (`06-sync-and-reconciliation/`), which remains Phase 2, gated.
