# REN-221 Category URL Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add canonical category-slug URLs while preserving legacy shop URLs, hierarchy safety, metadata, telemetry, and published-category deletion protection.
**Architecture:** Keep URL semantics pure and shared; resolve legacy redirects through a bounded authenticated Node route; render the dynamic category route through the existing catalog component; centralize mutation guards and preserve existing slugs.
**Tech Stack:** Next.js App Router 15, React, TypeScript, Drizzle ORM, Bun tests, Clerk middleware.
**Spec:** `docs/.work-items/REN-221/SPEC.md`

## Global Constraints

- [ ] No DB or Redis access from middleware.
- [ ] Legacy redirects fail open on ambiguity, lookup errors, timeouts, and hierarchy inconsistencies.
- [ ] Exact lowercase canonical slugs only; invalid filter combinations return non-indexable 404s.
- [ ] Preserve existing catalog filtering, sorting, pagination, search, analytics, and product/brand URL behavior.
- [ ] Use `bun test` and validate the REN-221 governance artifact before handoff.

## Tasks

- [ ] Add failing unit tests for URL construction, query preservation, redirect eligibility, and hierarchy validation.
- [ ] Implement shared category URL and editorial helpers, then make the URL tests pass.
- [ ] Add the dynamic `/shop/[category-slug]` route, metadata, canonical handling, and catalog integration.
- [ ] Add the authenticated, no-store internal category lookup route and middleware redirect handling with bounded timeout behavior.
- [ ] Preserve category slugs on update and add the published-category deletion conflict guard with typed telemetry.
- [ ] Migrate approved internal category links and keep legacy fallbacks where ancestry is incomplete.
- [ ] Run TypeScript/tests, governance validation, and the REN-221 review; inspect the final diff for scope and regressions.
