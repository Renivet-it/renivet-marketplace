# Failure Matrix — P08

Reuses the research's own required POC failure-scenario list (`16-final/POC_PLAN.md`) as the authoritative failure matrix, plus current-state reliability gaps (`10-performance-cost-reliability/`).

| Failure scenario | Current-state behavior | V1 required behavior |
|---|---|---|
| Malformed/corrupt file | Unspecified (importer is basic) | Rejected with clear error, no partial silent parse (AC-21) |
| Missing required field | Unspecified | Row rejected individually, batch continues (AC-22) |
| Ambiguous column (no confident schema match) | Silently empty/undefined | Surfaced for human resolution (AC-23) |
| Unknown SKU | Collected into `missingSkus`, discarded after a toast | Held in a persisted, reviewable queue (AC-24) |
| Duplicate SKU within one file | Unspecified | Detected and surfaced (AC-25) |
| Schema drift (missing/renamed/retyped column) | Silently degrades (e.g., Unicommerce client's `itemTypeSKU` empty-string fallback → "everything is a missing SKU") | Detected and surfaced; expected-column-disappears hard-fails the sync (AC-26) |
| Invalid stock value (negative, non-numeric, absurd magnitude) | Unspecified | Rejected (AC-27) |
| Missing/misassociated image | Unspecified | Surfaced, never silently linked to the wrong variant (AC-28) |
| Partial batch failure | One overwritten status/error field per brand (F7) | Per-row results; batch is not all-or-nothing (AC-29) |
| Retry of partially-failed batch | No retry/replay mechanism exists beyond OAuth 401/403 | Previously-succeeded rows not re-written (AC-30) |
| Cross-brand data access | **F10 — confirmed exploitable today** | Rejected at the procedure level for all 6 affected procedures (AC-31) |
| Serverless timeout mid-sync (existing Unicommerce path) | No `maxDuration` override found; sequential per-brand loop risks silent mid-loop truncation as brand count grows | Not a V1 scope item (existing path unchanged beyond F10) — flagged here as a known current-state risk, see `08-reliability/PERFORMANCE.md` |
| Transient network/API failure | Only OAuth 401/403 gets retry-then-refresh; no general backoff, no dead-letter/quarantine | Not expanded in V1 beyond the per-row isolation the import-batch/import-record design provides; general retry/backoff infrastructure is Phase 2 territory if evidenced |

## Isolation boundaries this matrix depends on

Per-brand isolation (existing, correct, preserved) and per-row isolation (new in V1, via the import-batch/import-record design in `06-data/DATA_REQUIREMENTS.md`) together mean no single bad row or bad brand can degrade another brand's or another row's outcome. This is the mechanism, not just the policy, behind most rows in this matrix.
