# Business Requirements — P02

## BR-1: Recommendation surfaces must degrade, not disappear (REN-147)

When the external similarity service is fully unavailable, cart cross-sell must still show *something* (generic/less-personalized, e.g. best-sellers or same-category items) rather than removing the entire section. **Rationale:** a full outage currently produces silent, total feature loss with no signal to the business that it happened. **Classification:** CONFIRMED requirement — directly derived from a confirmed defect.

## BR-2: Computed personalization must be reflected in what the shopper sees (REN-150)

The shop page's "Recommended" sort must present products ordered by their actual computed personalization rank (or a reasonable coarser-but-still-ordered approximation), not collapse the ranked list into "personalized vs. not." **Rationale:** engineering cost is already being paid to compute the rank; today's implementation pays that cost without capturing the benefit. **Classification:** CONFIRMED requirement.

## BR-3: Recommendation UI copy must describe what the system actually does (REN-157)

Copy such as "AI-powered similarity," "Complements your style choices," "Pairs well," and "Complements your cart" must not imply basket-aware or complementary-item logic that does not exist. Copy should describe single-item visual/semantic similarity accurately (e.g., "Similar styles," "Because you're browsing X"). **Rationale:** overclaiming erodes shopper trust if the mismatch between promise and result becomes apparent, and creates business risk if "AI-powered" claims are scrutinized (e.g., marketing/legal review, competitive comparison). **Classification:** CONFIRMED requirement.

## BR-4: Recommendation computation should not re-run from scratch on every request (REN-160)

Personalized recommendation results should be cached for a bounded, appropriate duration per surface, consistent with the freshness the surface needs (e.g., cart contents change more often than shop-page browsing history). **Rationale:** every uncached request pays full DB/ML cost; this is a cost and latency concern more than a correctness one today, but compounds as traffic grows. **Classification:** CONFIRMED requirement.

## BR-5 (VERIFICATION REQUIRED, not a committed requirement): Post-purchase recommendation surface (REN-165)

**DECISION REQUIRED.** Whether Renivet should add a recommendation surface on the order-confirmation/post-purchase page is unresolved. Two independent audit rounds rated this PROBABLE (not confirmed) — i.e., a plausible missed opportunity, not a validated gap. This package does not assume BR-5 is approved. See `07-feasibility/FEASIBILITY_ASSESSMENT.md` and `99-final/GO_NO_GO.md` for what would need to be true before this becomes a real requirement.

## BR-6 (EXPLICITLY DEFERRED, not a requirement): Genuine basket co-occurrence signal (REN-168)

**NOT YET APPROVED.** A true "frequently bought together" capability (built from actual co-purchase data, not single-item similarity) is deferred pending demonstrated business need. This package documents what such a capability would require (`05-algorithms/TARGET_ALGORITHM.md`, `10-roadmap/V2.md`/`V3.md`) without designing it in detail, per the explicit "do not build speculatively" tracking status.

## Out of scope for this Epic

- RE-F008 (recently-viewed, browser-local only) — QC disposition NO-ACTION, no demonstrated harm. Not a requirement here.
- Any new merchandiser/admin curation tooling for recommendations — not requested by any tracked issue; would need its own business case if desired.
