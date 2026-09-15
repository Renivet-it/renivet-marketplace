# REN-221 internal-link inventory

## Required category-aware consumers

These consumers must call `src/lib/shop/category-url.ts` and have focused tests:

- `src/components/shop/storefront-catalog-page.tsx`: category breadcrumb uses slug path; subcategory/product-type breadcrumbs retain valid narrower filters beneath the parent slug.
- `src/app/(marketing)/products/[slug]/page.tsx`: product breadcrumb category hierarchy uses the product's parent category slug; product URL is unchanged.
- `src/components/globals/layouts/navbar/navbar-home.tsx`: structured category, subcategory, and product-type navigation uses the known parent category slug.
- `src/lib/search/search-engine.ts` and `src/lib/search/search-navigation.test.ts`: category search results use slug paths; narrower results retain validated hierarchy filters.

## Required hard-coded home consumers

Each structured hard-coded category link is migrated to its corresponding current category slug constant. Implementation records every old ID to verified slug pair in deterministic fixtures and staging evidence; these known links do not fall back to query URLs:

- `src/components/home/beauty-personal/banner.tsx`
- `src/components/home/home-and-living/banner.tsx`
- `src/components/home/kids/banner.tsx`
- `src/components/home/men/banner.tsx`
- `src/components/home/women/banner.tsx`
- `src/components/home/new-home-page/mobile-categories.tsx` (or the exact matching mobile-categories module found at implementation time)
- `src/components/home/landing.tsx`: migrate its hard-coded category-filter URL to the verified category slug constant.

## Data-owned and excluded links

- Opaque database/CMS `item.url` values are not parsed or rewritten by REN-221; they require a content migration if owners choose to change them.
- Search results with missing or inconsistent parent ancestry retain their existing legacy query URL and must not synthesize a slug.
- Product detail URLs, brand URLs, checkout/cart URLs, campaign URLs unrelated to category hierarchy, and external links are excluded.
- A repository search for `/shop?categoryId`, `/shop?subCategoryId`, `/shop?subcategoryId`, and `/shop?productTypeId` must leave only documented data-owned exclusions, compatibility tests, and the legacy external-route handler.
