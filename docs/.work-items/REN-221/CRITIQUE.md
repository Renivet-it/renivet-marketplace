# REN-221 Independent Critic Reviews

## Review 1

Decision: `BLOCKED`.

The first review identified ambiguity in product-type-to-category mapping, public category eligibility, REN-217/REN-219 ownership, failure behavior, slug persistence, query normalization, observability, and rollout. The contract was revised to retain `productTypeId` beneath its parent category slug, treat all current category rows as public, use existing slugs without mutation, and define explicit handoffs and fail-open behavior.

## Review 2

Decision: `BLOCKED`.

The fresh-context critic found the following supported findings:

- `CRIT-221-009` (`DESIGN_BLOCKER`): conflicting `categoryId`, `subCategoryId`, and `productTypeId` inputs had no precedence rule.
- `CRIT-221-010` (`DESIGN_BLOCKER`): a build snapshot could not detect stale mappings despite promising stale fail-open behavior.
- `CRIT-221-011` (`MAJOR`): invalid slug response and metadata behavior was unspecified.
- `CRIT-221-012` (`MAJOR`): rollback control and slug-route behavior during rollback were unspecified.
- `CRIT-221-013` (`MINOR`): diagnostic abuse controls were unspecified.
- `CRIT-221-014` (`MAJOR`): authoritative category ancestry was ambiguous when product type and subcategory links disagree.
- `CRIT-221-015` (`MAJOR`): mapping generation/deployment integration was unresolved.
- `CRIT-221-016` (`MAJOR`): internal-link migration scope was not enumerated.
- `CRIT-221-017` (`MINOR`): duplicate productTypeId behavior was inconsistent.
- `CRIT-221-018` (`MAJOR`): telemetry thresholds and ownership were not operationally defined.
- `CRIT-221-019` (`MAJOR`): tests depended on mutable real data without deterministic fixtures.
- `CRIT-221-020` (`MAJOR`): dependencies were marked resolved without named interfaces, and the production approval decision was internally inconsistent.

## Architect response

All review-2 findings were incorporated before the next review:

- Redirect eligibility now requires exactly one `productTypeId` and no `categoryId` or `subCategoryId`; every conflict fails open unchanged.
- The stale snapshot design was removed. Middleware uses a 250 ms bounded same-origin Node lookup backed by current database state and a five-minute cache.
- `productTypes.categoryId` is authoritative, but lookup rejects rows whose subcategory ancestry disagrees.
- Invalid/non-canonical slugs return the standard non-indexable 404.
- `CATEGORY_SLUG_URLS_ENABLED`, default false, controls redirects and new links; rollback keeps slug routes available.
- Logs use bounded reason codes, 1% success sampling, 100% failure capture, public identifiers only, and public endpoint rate limiting.
- `src/lib/shop/category-url.ts` is the named handoff interface; required internal consumers and exclusions are enumerated.
- Vercel Observability ownership, windows, baseline, and rollback thresholds are explicit.
- Automated coverage uses deterministic fixtures; staging additionally samples real records.

## Attestation

Each critic review was performed in a fresh context, read-only, against the task-local contract and repository evidence. Critics modified no files.

## Review 3

Decision: `BLOCKED`.

The third fresh-context review identified three blockers and supporting gaps: cached 301s contradicted rollback claims; slug routes lacked path/query conflict rules; ordinary category-name edits could mutate public slugs; the proposed route-handler limiter did not exist; timeout cancellation, link inventory, client flag propagation, metric denominators, deterministic logging, and staging-vs-automated tests needed concrete contracts.

The contract was revised again:

- Redirect rollout is now `off -> temporary (307) -> permanent (301)`, with permanent mode only after acceptance and explicit acknowledgement that cached 301s cannot be recalled.
- Slug paths are authoritative; every supplied hierarchy filter must resolve beneath that category or the route returns non-indexable 404.
- Ordinary category-name updates preserve published slugs.
- Lookup is secret-protected rather than public/rate-limited, uses one indexed join with database and request deadlines, and has no Redis dependency.
- `LINK-INVENTORY.md` enumerates concrete consumers and data-owned exclusions.
- Internal links always use available slug routes, so the server-only mode controls redirects only and does not propagate to clients.
- Every bounded telemetry event is logged; formulas, windows, zero-volume behavior, owner, and rollback thresholds are specified.
- Deterministic fixture tests and staging business-UAT evidence are separate expectations.

## Review 4

Decision: `BLOCKED`.

The fourth review found two remaining blockers: the live lowercase `subcategoryId` alias was missing from conflict rules, and rollback language still contradicted the decision to keep slug links active. It also identified stale generated-mapping verification, incomplete hard-coded-link disposition, sampled-versus-exhaustive telemetry wording, missing UAT traceability, a missing dependency reference, and untested middleware traversal for the internal route.

The contract now handles both subcategory spellings and their duplicates/conflicts; consistently keeps slug links/routes active in every redirect mode; removes generated-mapping obligations; makes every hard-coded structured link a required verified migration; uses exhaustive telemetry; completes dependency/UAT traceability; and explicitly tests that the secret internal route bypasses Clerk/redirect recursion for anonymous and authenticated callers within the deadline.

## Review 5

Decision: `BLOCKED` on one Class C policy decision.

The fifth review confirmed the routing design but identified category deletion as a remaining design blocker because the existing authorized operation cascades records and can invalidate indexed/cached permanent destinations. It also identified link-inventory, redirect-status, no-store, telemetry taxonomy, search fallback, and token-configuration gaps. Those non-policy gaps are incorporated. `DEC-221-011` records the recommended deletion guard and remains the sole approval blocker.

## Owner decision

On 2026-09-15, Ayan Ganguly approved blocking ordinary deletion of published categories. Safe category retirement and historical redirects remain a separate future workflow. The contract was submitted for a final fresh-context critic review after this approval.
