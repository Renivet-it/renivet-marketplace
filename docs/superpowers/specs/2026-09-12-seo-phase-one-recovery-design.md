# SEO Phase One Recovery Design

## Goal

Deliver REN-215, REN-216, REN-217, REN-219, and REN-220 as a reviewable, tested change based on current `main`, replacing oversized PR #658.

## Branch and Delivery Architecture

Create an isolated worktree and a new branch from `origin/main`. Transfer only the task-local governance artifacts and intentional SEO implementation. Do not carry historical commits or unrelated application changes from `feat/seo-phase-1-foundation`. Open a replacement pull request and close #658 only after the replacement is pushed and verified.

## Festive SEO

Keep `/festive` server-rendered and `force-dynamic`. Preserve its canonical, analytics path, and campaign-specific hero art. Emit exactly one H1 and one responsive hero priority signal. Build ItemList/Product JSON-LD from the authoritative catalog projection, including `mediaItem.url`, real paise-to-INR price conversion, current availability, and no fabricated ratings.

## Shop Metadata and Canonicals

Keep the descriptive shop title and 150–160 character description. Render exactly one page H1 through the shared storefront boundary. The clean `/shop` route remains canonical. Filtered query URLs must not be submitted as independent canonical sitemap entries until clean category landing routes exist.

## Sitemap Architecture

Move sitemap data shaping into a server-only module with pure helpers for URL mapping, deterministic sorting, deduplication, and shard slicing. Query authoritative live products, published blogs, active brands, and fixed routes. Categories are not emitted as `/shop?categoryId=...` because those URLs canonicalize to `/shop`; this avoids contradictory crawler signals.

Use a shard size of 50,000 URLs. Count or collect identifiers deterministically, expose `generateSitemaps()` only when multiple shards are required, and fetch each shard with bounded limit/offset queries ordered by stable keys. Every dynamic entry uses stored `updatedAt`; fixed entries omit fabricated modification dates. Database/query failures fail visibly rather than returning a misleading partial sitemap.

## Shared H1 and Schema

The homepage owns one root H1. Existing section headings remain visible as H2 elements and an executable guard prevents those components from reintroducing H1. Product and blog templates emit deterministic clean canonicals. Root layout emits one Organization/WebSite graph using configured identity values. Published blog pages emit BlogPosting from stored fields and unpublished pages remain unavailable.

## Verification

Replace source-presence assertions with output-oriented unit tests around pure SEO builders and metadata objects. Cover festive media projection, truthful offers, deduplication, stable ordering, live-state filters, shard boundaries, canonical consistency, metadata lengths, and heading ownership. Run focused tests, `bun test`, TypeScript checking, production build where environment permits, all five governance validators, and a fresh contract review. Record environmental blockers exactly if the full build or suite cannot run locally.

## Rollback

The replacement PR contains no migrations or data writes. Rollback is a normal revert of the isolated SEO commits. PR #658 remains open until the replacement exists, then is closed with a link to the new PR.
