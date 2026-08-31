# Resource Assessment — P02

All effort estimates are **INFERRED** (no formal estimation session occurred; this is a directional sizing based on the confirmed complexity of each fix, for planning discussion only — not a committed estimate).

| Item | Skillset | Rough size | Notes |
|---|---|---|---|
| REN-147 | Backend (TypeScript/tRPC/Postgres) | Small-Medium | Reuse of existing pattern (Placement B); main work is porting + the multi-category cart tie-break decision |
| REN-150 | Backend (SQL/Drizzle) | Small | Single function, well-isolated change |
| REN-157 | Content/frontend (copy + minor JSX text changes) | Small | No engineer needed beyond someone comfortable editing two `.tsx` files; content decision (what copy to use) may need a product/marketing reviewer, which is a coordination cost more than an engineering one |
| REN-160 | Backend (caching pattern, Redis or `unstable_cache`) | Small-Medium | Two cache insertion points; TTL tuning may need a follow-up adjustment after observing real traffic |
| REN-165 | Product/analytics (verification), not engineering | Small (as verification) | See `09-validation/EXPERIMENT_STRATEGY.md` — could be a short survey, a review of comparable e-commerce patterns, or a lightweight instrumented test; not a build task in V1 |
| REN-168 | Not resourced | N/A | Deferred; no resource assessment performed per scope instruction |

## Coordination resources needed

- A content/copy reviewer for REN-157 (marketing or product, not engineering).
- Coordination with whoever picks up P01's REN-146 (shared `sematic-search.ts`/`product-recommendation.ts` modules) before shipping REN-147/160's changes to those shared files, to avoid conflicting edits — see `DEPENDENCIES.md`.
- No new external vendor, infra procurement, or specialized ML/data-science resourcing is needed for any V1 item — all four confirmed defects are fixable with the existing team's existing stack (Next.js/tRPC/Drizzle/Postgres/Redis).
