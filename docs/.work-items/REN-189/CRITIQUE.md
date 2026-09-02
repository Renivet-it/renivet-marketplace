# REN-189 Independent Critic Review

Reviewer: independent Codex Critic  
Context: Fresh review of `SPEC.md`, `work-item.yaml`, and repository evidence  
Mode: Read-only; no application files, tests, Linear records, or Git state were changed.

## Category coverage

- Requirements and scenarios: covered after traceability reconciliation.
- Failure and recovery: covered for crawler, anonymous, consent-limited, provider, database, partial-order, and telemetry failures; uncertain user agents fail open.
- Security and privacy: covered after defining safe persisted-log projections and legacy read/export redaction.
- State and data consistency: covered after defining event-ID ownership and completed-order Purchase identity.
- Integrations and idempotency: covered for Meta Pixel/CAPI, Postgres logs, Next/Vercel lifecycle, and crawler/Search Console validation.
- Compatibility and migration: covered; no historical rewrite, SEO change, token change, or schema migration is authorized.
- Observability and testability: covered by privacy-safe counters, coverage metrics, dashboard/export requirements, and mapped tests.
- Assumptions and dependencies: covered; canonical completed-order identity remains an implementation validation gate.

## Findings and dispositions

### D-001 — Design blocker: raw CAPI logs conflicted with privacy requirements

Evidence: `src/lib/fb-capi.ts` persists raw `userData`/`customData`; `src/lib/db/schema/capi-logs.ts` stores unrestricted JSONB; the CAPI dashboard/router exposes complete rows.

Disposition: Resolved in contract. `REQ-007`, `INV-005`, `SCN-009`, `DEC-004`, and `TEXP-008/009` now require a safe new-row projection, legacy dashboard/export redaction, and tests covering provider-token and raw-PII absence.

### D-002 — Design blocker: traceability and test IDs were inconsistent

Disposition: Resolved in contract. SPEC/YAML test IDs now agree, `TEXP-014` is present, and explicit flow-to-test mappings were added.

### M-001 — Major: rollout flag and production semantics were unspecified

Disposition: Resolved in contract. `META_CAPI_SUPPRESS_CRAWLERS` is the authoritative server flag; absent/unreadable means disabled with a non-PII diagnostic, production enablement is explicit, and uncertain agents fail open.

### M-002 — Major: stable IDs did not define duplicate behavior

Disposition: Resolved in contract. Upper-funnel IDs are request/action scoped; Purchase IDs are deterministic and completed-order scoped, reused across Pixel/CAPI and same-order retries. The implementation must stop if no canonical completed-order identity exists.

### M-003 — Major: fbclid/fbc and hashing boundaries were underspecified

Disposition: Resolved in contract. `_fbc` has precedence; otherwise a consent-eligible `fbclid` may be converted once to `fb.1.<timestamp_ms>.<fbclid>`, while `fbp/fbc` remain raw and personal fields cross the one-time SDK hashing boundary.

## Recommendation

The findings are resolved in the revised contract. The contract is approved for `READY_FOR_DEV` after governance validation passes. Implementation must preserve the explicit SEO, consent, privacy, idempotency, and REN-145 boundaries.

