# REVIEW: REN-189 — Improve Meta CAPI event match quality and analytics signal integrity

## Executive Result

`REVIEW_PASSED_WITH_FINDINGS`; `NO_DRIFT`; governance re-entry is not required. Compared `origin/main` commit `c0852b3512031fe0f27babd5965f2fa3a0ec5022` with implementation commit `bb5384027765cbcc5740b1eeb35392cd4babd939`. The hotfix closes a production-observed crawler-signature gap within the approved conservative detector; required external and post-deployment verification remains operator-owned.

## Review Scope and Git Evidence

The comparison contains only `src/lib/analytics/meta-event-quality.ts` and `src/lib/analytics/meta-event-quality.test.ts`: ten insertions and one deletion. The production hunk adds explicit `YouBot`, `MJ12bot`, `OAI-SearchBot`, and `DotBot` signatures to `BOT_USER_AGENT_PATTERN`; the test hunk adds the four exact observed user agents to the existing crawler-versus-browser behavior test. No uncommitted implementation state was present when the comparison commits were resolved. No PR existed at review time.

## Requirement Reconciliation

- `REQ-001`: PASS. `isLikelyAnalyticsBot` now classifies the four production-observed crawler signatures while the existing ordinary desktop/mobile and `CUBOT X30` assertions preserve normal page eligibility. The diff changes only analytics classification, not page rendering or SEO paths.
- `REQ-002`: PASS. The hotfix does not alter `META_CAPI_SUPPRESS_CRAWLERS`, its disabled-by-default behavior, or the privacy-safe suppression diagnostic.
- `REQ-003`–`REQ-007`: PASS. The diff does not modify browser identifiers, identity enrichment, event IDs, Purchase behavior, outbound hashing, CAPI persistence, or dashboard authorization; the merged REN-189 implementation at the comparison base remains intact.
- `REQ-008`: PARTIAL. Static evidence improves crawler classification coverage, but Meta Test Events, crawler inspection, and post-deployment human-only quality measurement remain external operator actions.

## Scenario Reconciliation

- `SCN-001`: PASS. Exact observed crawler requests are newly classified for the existing feature-gated suppression path, with no page-path change.
- `SCN-002`: PASS. Existing assertions retain ordinary desktop/mobile browsers and the bot-like `CUBOT X30` device as eligible.
- `SCN-003`–`SCN-010`: PARTIAL. Their merged implementations and static tests are unchanged by this narrow matcher hotfix; complete deployed consent, cookie, provider, crawler, and order-path evidence remains outside this diff.

## Invariant Reconciliation

- `INV-001`–`INV-002`: PASS. The change is confined to explicit analytics crawler signatures, preserves uncertain-user-agent fail-open behavior, and leaves access, rendering, metadata, JSON-LD, robots, and indexing controls untouched.
- `INV-003`–`INV-008`: PASS. Identity construction, raw browser identifiers, hashing/logging boundaries, event-ID parity, telemetry isolation, and REN-145 Purchase semantics are unchanged.

## Flow and Architecture Review

- `FLOW-001`: PASS. Classification remains in the shared server analytics boundary; the hotfix only expands confirmed inputs recognized by that classifier.
- `FLOW-002`–`FLOW-003`: PASS. Identifier enrichment, Pixel/CAPI dispatch, and completed-order Purchase flow are unchanged.
- `DEP-001`–`DEP-004`, `INT-001`–`INT-003`: PASS. No dependency, interface, persistence, lifecycle, retry, or failure-handling contract changes.
- `DEP-005`, `INT-004`: PARTIAL. Meta Test Events and deployed crawler/Search Console verification are not available as repository evidence.

## Security and Integration Review

- `SEC-001`–`SEC-005`: PASS. No token, database, authorization, consent, identity, logging, or provider-payload code changed. The explicit signatures do not introduce synthetic identifiers or expose request/customer data.
- Meta CAPI integration behavior changes only for requests that identify themselves as one of four confirmed crawlers and only when the existing suppression flag is enabled.

## Scope and Drift Review

`NO_DRIFT`. Explicitly recognizing additional clear crawler signatures is implementation detail authorized by `REQ-001`, `INV-002`, `DEC-001`, and `DEC-002`. The diff contains no schema, migration, configuration, SEO, page-content, queue, retry, token, attribution, checkout, order, or unrelated change.

## Test Expectation Review

- `TEXP-001`: PASS. The real classifier is exercised with all four exact observed crawler user agents while existing ordinary-browser, mobile-browser, `CUBOT`, empty-agent, and flag behavior coverage remains present.
- `TEXP-002`–`TEXP-011`: PASS for static regression scope. Their existing implementation/tests are unchanged, and the hotfix does not alter diagnostics, identifiers, identity, event IDs, page lifecycle, Purchase, logs, dashboard, or customer flows.
- `TEXP-012`–`TEXP-014`: PARTIAL. Deployed crawler/browser inspection, Meta Test Events, and 48–72-hour EMQ/human-only coverage measurement remain operator-owned.

## Findings

None.

## Decisions Requiring Attention

None.

## Final Recommendation

The hotfix is consistent with the approved REN-189 contract and may proceed to PR review. After deployment, confirm the four observed crawler agents no longer create CAPI rows when `META_CAPI_SUPPRESS_CRAWLERS=true`, then complete the existing Meta Test Events and 48–72-hour human-only quality checks.
