# Current Algorithm — P08

## Identity matching (Unicommerce path, today)

`syncInventoryBySku` performs exact string equality on `sku`, brand-scoped. This is the *only* identity-matching code path that exists in production today. `nativeSku` is unique and system-generated but never used as an external mapping target; `barcode` exists on both `products` and `productVariants` but is read by no matching code. (Research: F5; `05-identity-and-mapping/SKU_IDENTITY.md`.)

Unmatched SKUs are collected into a `missingSkus` array and discarded after a one-shot UI toast — no persisted, reviewable queue exists. This is a hard requirement to fix, not a nice-to-have. (Research: `ENTITY_RESOLUTION.md`.)

## Schema/column mapping (today)

The XLSX importer matches columns by exact hardcoded header string; on mismatch, fields are silently empty/undefined, with no error. The Unicommerce client reads exactly one field name (`itemTypeSKU`) with an empty-string fallback, which silently degrades to "everything is a missing SKU" on any drift. Both patterns fail via silent degradation, not loud failure. (Research: `05-identity-and-mapping/SCHEMA_DRIFT.md`.)

## Failure handling (today)

Per-brand isolation exists and works (a try/catch loop around each brand's sync). There is no per-item isolation within a brand's own batch transaction — one bad SKU can currently block or roll back the whole brand's batch, or silently drop rows before the transaction begins. Only OAuth 401/403 gets retry-then-refresh; there is no general transient-failure retry/backoff, no dead-letter/quarantine, and no replay mechanism. (Research: `06-sync-and-reconciliation/`.)

## The superseded design this package explicitly does not carry forward: confidence-tier auto-apply

`05-identity-and-mapping/CONFIDENCE_MODEL.md` (Wave 4/5) originally proposed:

| Tier | Definition | Action (as originally designed) |
|---|---|---|
| Tier 1 — Deterministic exact | Unambiguous, rule-based, no similarity threshold | Auto-apply, no review |
| **Tier 2 — Corroborated fuzzy** | Fuzzy/similarity signal (title trigram ≥0.90, or embedding cosine) **combined with** ≥1 independent corroborating signal (brand, variant attributes, price band) | **"Auto-apply, but flagged for audit sampling." Written immediately; included in a periodic review sample.** |
| Tier 3 — Uncorroborated fuzzy | Single fuzzy signal, no corroboration; or multiple weak signals | Held, human confirms/rejects before write |
| Tier 4 — No usable match | Below threshold, or multiple equally-plausible candidates | Rejected, persisted unresolved, never guessed |

The 0.90/0.75 thresholds were explicitly labeled INFERRED — "a starting proposal, not derived from any authoritative source" (`CONFIDENCE_MODEL.md` §5) — and Tier 2's justification was that combining a fuzzy signal with corroboration "converts 'the AI thinks this is a 92% match' into 'two independent methods agree,' which is a materially different (and stronger) claim."

**This design is superseded.** See `05-algorithms/DECISION_LOGIC.md` and `11-critique/ARCHITECTURE_CRITIQUE.md` for why, and `TARGET_ALGORITHM.md` for the corrected design this package actually specifies for V1 and beyond. It is preserved here, verbatim in substance, only so the correction is legible against what it corrected.
