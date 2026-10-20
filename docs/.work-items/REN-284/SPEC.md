# REN-284 — Responsive Renivet home page design

## Status

`READY_FOR_DEV`

## Scope

Define and implement the complete Renivet home page experience for desktop and
mobile using the updated Figma design system. The contract covers page
composition, responsive behavior, navigation, hero, shopping discovery,
promotional/editorial content, trust messaging, footer, interaction states,
asset requirements, reusable components, and design handoff notes.

This is a presentation and interaction-design task. It does not authorize
schema changes, product/catalogue data changes, checkout or payment changes,
new authentication behavior, production configuration changes, or production
data mutation.

## Evidence reviewed

- REN-284 Linear issue, Figma attachment, priority, status, branch, comments,
  and relations; no comments or linked relations were present.
- `src/app/(home)/page.tsx`, the current home-page composition and Suspense
  boundaries.
- `src/components/home/landing.tsx`, the current desktop/mobile hero,
  carousel, search, category, and brand-navigation behavior.
- Existing `src/components/home/new-home-page/*` sections for products,
  categories, brand promotion, editorial content, trust content, and mobile
  surfaces.
- Existing global navigation/layout components, site metadata, image usage,
  and repository test/governance scripts.

## Current-state findings

1. The home route already composes a large set of independently loaded
   sections, and several sections are commented out or conditional.
2. `Landing` currently uses separate desktop and mobile compositions, including
   a desktop carousel, a mobile search/category strip, and a mobile carousel.
3. Product, category, brand, editorial, trust, and blog content is fetched from
   existing query/component paths; the design must preserve those data
   boundaries unless implementation evidence requires a separately approved
   change.
4. The issue supplies a Figma design-system reference but does not specify
   exact breakpoint values, section ordering beyond the complete journey,
   asset ownership, or analytics requirements. This contract resolves only
   low-risk convention-based details and records the remaining implementation
   handoff constraints.

## Design contract

- The page has a coherent desktop and mobile journey from global navigation
  through discovery, shopping/product content, brand/editorial storytelling,
  trust messaging, and footer.
- Responsive behavior is specified for the supported viewport range, including
  section visibility, stacking, horizontal overflow, image cropping, CTA
  placement, navigation collapse, and touch targets.
- The updated Figma design system is the source of truth for typography,
  spacing, color, radius, elevation, iconography, component states, and visual
  hierarchy. Any intentional deviation is recorded in handoff notes.
- Every interactive element has loading, empty, hover where applicable, focus,
  pressed/active, disabled, error or unavailable, and long-content behavior
  defined where that state can occur.
- CTAs clearly support shopping, brand discovery, and corporate journeys, and
  retain valid destinations and accessible names.
- Existing server/query boundaries remain reusable. Empty or unavailable
  content must collapse safely without leaving broken spacing or inaccessible
  controls.
- Images and other assets have documented source, dimensions/aspect ratio,
  responsive variant, focal point/crop guidance, alt-text ownership, and
  fallback behavior.
- Handoff documentation identifies reusable components, design tokens, asset
  inventory, breakpoint rules, content assumptions, open implementation notes,
  and visual acceptance evidence.

## Decisions

- `DEC-284-001`: Use the attached updated Figma design system as the visual
  authority. Class A, resolved from the explicit issue requirement and linked
  design artifact.
- `DEC-284-002`: Preserve current home-page data/query boundaries unless the
  implementation discovers a required contract mismatch. Class B, recommended
  because the issue is a presentation task and the current route already owns
  content loading.
- `DEC-284-003`: Treat desktop and mobile as first-class compositions with
  shared semantic components where practical, rather than assuming a single
  desktop layout will responsively scale. Class B, based on the existing
  separate mobile/desktop hero and navigation paths.
- `DEC-284-004`: Exact breakpoints, final asset URLs, editorial copy, and
  section ordering details must be confirmed against the Figma frames during
  implementation and recorded in the handoff. Class B; this is not a blocker
  because the linked design artifact is the intended source.

## Release and rollback

Validate the design in local/staging preview at representative desktop,
tablet, and mobile widths. Capture visual evidence for the complete journey,
keyboard/focus behavior, reduced-motion behavior where animation exists, empty
content, slow/loading content, and long labels/copy. Rollback is a normal
deployment revert; no data rollback or migration is expected.

