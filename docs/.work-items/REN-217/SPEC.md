# REN-217 — Database-driven dynamic sitemap

Replace the four-entry sitemap with read-only database-backed URLs for live products, collections, blogs, brands, static pages, home, shop, festive, and swap-passport. Preserve current category URL format until migration. Check total URL count before deciding whether sharding is needed.

Validation covers live-state filtering, timestamps/priorities, automatic updates, URL count, and sitemap XML output.

## Canonical-safe collection decision

The approved SEO Phase One sitemap design excludes category and collection
filter URLs until the repository provides an authoritative public collection
entity with a stable canonical route and a live/published predicate. This is
not an omission of a known canonical URL: `categories` has no public-state
fields, `/shop?categoryId=...` is a filter variant whose marketing layout
declares `/shop` as canonical, and the collection-named tables are homepage
content without public per-record routes. The standalone `/summer-collection`
page likewise is not backed by a canonical collection entity.

Accordingly, the sitemap includes the canonical `/shop` entry once and must
not count, query, or emit category/collection filter variants. The focused
sitemap test verifies that query variants are excluded while `/shop` remains.
When a public canonical collection route and live/published source are added,
this decision must be revisited and the new records included consistently in
the count, bounded shard window, and URL mapping.
