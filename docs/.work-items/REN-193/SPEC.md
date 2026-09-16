# REN-193 Engineering Specification

## Scope

**Linear:** REN-193 — `Deployment of the brand tab on the landing page`
**Branch:** `ayanganguly333/ren-193-deployment-of-the-brand-tab-on-the-landing-page`
**Risk:** L2 — public navigation, responsive overlays, and a new public brand projection

Add a `BRANDS` entry beside the existing desktop department navigation. Hover and keyboard focus open a compact brand menu containing the first nine available brands in the approved business-priority order. Mobile uses a tag-icon action that opens the same catalogue in a bottom sheet. `View All Brands` opens a searchable responsive directory. Every brand entry uses the existing brand logo/name and links to `/brands/{slug}/shop`.

## Repository evidence

- `src/components/globals/layouts/navbar/navbar-home.tsx` owns the shared desktop and mobile marketplace header.
- `src/lib/trpc/routes/general/brands.ts` currently exposes a protected administrative brand query; guest navigation needs a separate whitelisted public projection.
- `src/lib/db/schema/brand.ts` provides `id`, `name`, `slug`, `logoUrl`, and `isActive`.
- `src/components/festive-home/festive-brand-showcase.tsx` confirms the public brand-shop URL and existing logo fallback behavior.
- Radix-backed `NavigationMenu`, `Dialog`, and `Sheet` primitives already provide focus, escape, and outside-click behavior.

## Approved design

1. Use one shared active-brand response containing only `id`, `name`, `slug`, and `logoUrl`.
2. Sort matched brands by the user-approved priority list, then sort all remaining brands alphabetically. Missing priority brands do not create empty cards.
3. Desktop renders nine compact logo/name cards in the `BRANDS` hover/focus menu and a `View All Brands` action. It does not render the large My Mithila promotional banner.
4. Mobile renders a tag-icon trigger and bottom sheet with the same first nine brands. `View All Brands` opens the full directory.
5. The full directory supports search, remains usable without logos through a name/initial fallback, and links each result to its existing public brand shop.
6. Do not expose inactive brands, owner/contact/confidential data, or create a second brand catalogue.

## Verification

- Unit tests prove priority aliases, missing-priority handling, alphabetical fallback, and search.
- Component/source contract tests prove the public projection, desktop menu, mobile sheet, shared full directory, and canonical brand links.
- Desktop and mobile browser checks cover hover/focus, sheet/dialog behavior, scrolling, image fallback, search, and navigation.
- Run the repository TypeScript/JavaScript test suite and governance validation.
