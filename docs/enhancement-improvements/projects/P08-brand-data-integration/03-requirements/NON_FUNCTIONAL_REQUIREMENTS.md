# Non-Functional Requirements — P08

## Security / tenant isolation

- **NFR-1**: No brand shall be able to read, write, or trigger an operation against another brand's import, mapping, inventory, price, media, credentials, or logs. (Research: F10, S1; see `08-reliability/SECURITY.md` for the exhaustive walk.)
- **NFR-2**: Unicommerce credentials at rest shall not depend on key material shared with unrelated systems (current gap: encryption key derived from `JWT_SECRET_KEY`, S2) — flagged for remediation planning, not scoped as a V1 blocking requirement since it is lower severity than F10.

## Reliability

- **NFR-3**: A partial failure within a batch shall not roll back or block unrelated rows in the same batch (per-item isolation), while preserving today's correct per-brand isolation. (Research: `06-sync-and-reconciliation/` Failure Handling.)
- **NFR-4**: The system shall never leave a batch in a state where a retry double-applies an already-succeeded row. (Research: Retry/Replay.)

## Performance

- **NFR-5**: File-First ingestion is manual-cadence (brand-triggered), so no near-real-time freshness SLA applies in V1 — this is an explicit, accepted trade-off, not a gap, since brands needing near-real-time freshness are, by the research's evidence, already served by the existing Unicommerce path. (Research: `13-option-comparison/COMPARISON_MATRIX.md`.)
- **NFR-6**: Batch validation and dry-run diff generation shall complete within a time budget a brand operator will tolerate interactively (no hard number set by research — flagged as a V1 implementation detail to size against real file sizes, not a researched target). UNKNOWN precise target; see `08-reliability/PERFORMANCE.md`.

## Auditability

- **NFR-7**: Every AI-assisted decision (schema mapping suggestion, attribute normalization, SKU candidate ranking) shall log input, output, confidence, tier, action taken, and the human-decision link. (Research: `08-ai-opportunities/AI_GUARDRAILS.md`.)
- **NFR-8**: Every write shall be traceable to a source and a timestamp (provenance) and to a batch (import log). (BR-4.)

## Usability

- **NFR-9**: Validation and mapping-failure messaging shall be understandable by a non-technical brand operator (Priya persona) without contacting Renivet engineering. (Research: `09-brand-onboarding/BRAND_EXPERIENCE.md`.)

## Maintainability / anti-overengineering

- **NFR-10**: V1 implementation shall not introduce infrastructure (webhook listeners, scheduled pollers, a generalized connector abstraction, a confidence-tier auto-apply pipeline) ahead of the specific named trigger that justifies it. (Research: `14-critic/ANTI_OVERENGINEERING.md`; see `10-roadmap/VERSION_TRIGGERS.md`.)

## Explicitly out of scope for NFRs in V1

Multi-region, high-availability, or throughput targets beyond current single-instance cron-based sync scale — no evidence of need at ~50-brand scale. (Research: `10-performance-cost-reliability/OPERATIONAL_MODEL.md`.)
