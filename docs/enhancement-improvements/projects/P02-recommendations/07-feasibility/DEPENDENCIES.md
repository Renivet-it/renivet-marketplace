# Dependencies — P02

## Cross-Epic (per `../../DEPENDENCY_GRAPH.md`)

- **P01 ↔ P02 (shared infrastructure, not directional):** both depend on the external ML host at `64.227.137.174:8000`. REN-146 (P01's issue — timeouts/hardening on this host) and this Epic's REN-147 (P02's issue — architectural independence from this host) are complementary, not sequential — neither blocks the other, but shipping them uncoordinated risks two teams editing `src/lib/python/product-recommendation.ts` / `sematic-search.ts` at the same time. **Recommendation: coordinate timing, not because of a hard dependency, but to avoid merge conflicts on shared files.**
- **P08 → P02 (catalog data quality):** recommendation output quality on all three placements depends on catalog completeness (category tagging, media, embeddings) owned by P08. This is a quality-ceiling dependency, not a blocker — P02's V1 fixes (REN-147/150/157/160) all ship independently of any P08 work, since none of them depend on catalog data being *more* complete than it is today (they fix architecture/copy/caching, not data quality). Named for completeness per the dependency graph, not because it blocks V1.
- **P02 → P06 (measurement):** REN-160/165 both surface a shared gap — no recommendation-specific event schema exists for P06 (Measurement & Experimentation) to consume. If REN-165's verification or any future recommendation A/B testing is to happen credibly, P06 (or a P02-owned instrumentation task) would need to add impression/click events first. This is a prerequisite for *verifying REN-165 well*, not for shipping V1's four confirmed fixes.

## Internal (within this Epic)

- REN-150's fix has no dependency on REN-147/157/160 or vice versa — all four V1 items are independently shippable in any order.
- REN-160's caching of `getAdvancedRecommendations` (Placement A/B shared) should ideally land *before or alongside* REN-147's new fallback tier, so the new fallback path doesn't need separate caching consideration added later — but this is a sequencing efficiency suggestion, not a hard blocker (shipping REN-147 first and REN-160 second works fine too).

## No blocking external dependencies

No third-party vendor contracts, infra procurement, legal/compliance sign-off (beyond the existing marketing-copy review already named in `RESOURCE_ASSESSMENT.md`), or database migrations are required for any V1 item.
