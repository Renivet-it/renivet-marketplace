# P02 — Recommendations & Personalization

Project package for **EPIC-P02-001** in Renivet's Enhancement & Improvements program. Documentation-only artifact — no application code, tests, config, or Linear issues are modified by this package.

## Scope

Renivet's three live recommendation-adjacent surfaces:

1. **Cart cross-sell** ("wardrobe suggestions") — `mycart` page, `getWardrobeSuggestions` tRPC procedure.
2. **PDP "similar products"** — product detail page, `YouMayAlsoLike` component, `getRecommendations` tRPC procedure.
3. **Shop-page personalized sort** ("Recommended" default sort) — `storefront-catalog-page.tsx`, `getPersonalizedRecommendations` query.

A fourth, speculative surface (post-purchase/order-confirmation recommendations) is verification-only (REN-165) and must not be treated as approved scope. A fifth, explicitly deferred capability (genuine basket co-occurrence / "frequently bought together", REN-168) is named throughout as a gated V2/V3 item, not committed work.

## How to read this package

- Every material claim in every file is tagged **CONFIRMED** (verified against the current source in `renivet-marketplace` during this pass), **INFERRED** (reasonable but not directly observed), **UNKNOWN** (not determinable from available evidence), or **DECISION REQUIRED** (needs a business/product call before design can proceed).
- Cross-references: `../../02-epics/EPIC_MAP.md` (EPIC-P02-001), `../../DEPENDENCY_GRAPH.md` (P01↔P02 shared dependency), `../../AUDIT_TO_BACKLOG_TRACEABILITY.md` (RE-F002, RE-F004, RE-F006, RE-F007, RE-F008, PF-F006 → REN-147/150/157/165/168/160).
- Start at `99-final/EXECUTIVE_SUMMARY.md` for the short version, `99-final/SRS.md` for the full spec, `99-final/GO_NO_GO.md` for the verdicts.

## Linear issues covered

| Issue | Title | Status | Priority |
|---|---|---|---|
| REN-147 | Cart cross-sell fallback hits the same host as its primary call | Backlog | High |
| REN-150 | Shop page "Recommended" sort discards computed rank into a binary bucket | Backlog | High |
| REN-157 | Relabel cart/PDP recommendation copy to accurately describe similarity-based suggestions | Backlog | Medium |
| REN-160 | Cache personalized recommendation computation results | Backlog | Medium |
| REN-165 | [Verification] Confirm whether a post-purchase recommendation surface is worth adding | Backlog | Low (verification-only) |
| REN-168 | [Deferred] Genuine basket co-occurrence signal — gated on demonstrated business need | Backlog | Low (deferred) |

All are `Renivet` team, `qa-finding` label. No dedicated Linear Project exists for P02 — flat team backlog only.
