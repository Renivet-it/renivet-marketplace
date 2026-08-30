# REN-110 Specification

## Goal

Remove the Radix accessibility warning when the storefront product-search sheet opens by associating an accessible description with its dialog content.

## Evidence and scope

- Linear reports `Missing 'Description' or aria-describedby={undefined} for {DialogContent}` whenever the search UI opens.
- `src/components/ui/product-search.tsx` renders the search UI through `SheetContent`, `SheetHeader`, and `SheetTitle`; the header is visually hidden and has no description. `ProductSearch` is shared by the navbar, landing, catalog, and event-filter surfaces.
- `src/components/ui/sheet.tsx` wraps Radix Dialog primitives and already exports `SheetDescription`.
- Scope is the product-search sheet accessibility contract and regression coverage. Preserve focus management, close behavior, search results, layout, and visual UX.

## Acceptance criteria

- Opening the product-search sheet produces an associated non-empty accessible description and no missing-description console warning.
- The description may be visually hidden because the search controls already communicate the visible purpose, but it must remain available to assistive technology.
- Search open/close, focus, keyboard escape, result navigation, and responsive layout remain unchanged.
- Regression coverage checks the rendered dialog relationship and a browser smoke path confirms no warning on open.

## Decision

Add a concise, stable, visually hidden `SheetDescription` with `className="sr-only"` to the product-search sheet, scoped to this shared component. Verify the navbar, landing, catalog, and event-filter consumers. Do not weaken the shared primitive or suppress the warning globally.
