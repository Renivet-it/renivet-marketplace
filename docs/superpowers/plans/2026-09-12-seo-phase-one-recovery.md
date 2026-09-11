# SEO Phase One Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete REN-215, REN-216, REN-217, REN-219, and REN-220 on a clean current-main branch with correct structured data, canonical-safe sharded sitemaps, output-level tests, and a merge-ready replacement PR.

**Architecture:** Work in an isolated `origin/main` worktree. Keep route metadata close to route files, extract pure schema and sitemap builders for deterministic testing, and keep database access in a server-only sitemap data module. Replace PR #658 only after verification and fresh governance reviews pass.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Drizzle ORM, Bun test runner, Renivet governance tooling.

**Spec:** `docs/superpowers/specs/2026-09-12-seo-phase-one-recovery-design.md`

## Global Constraints

- Preserve `/festive` `force-dynamic`, canonical, SSR, and analytics behavior.
- Never fabricate ratings, reviews, prices, availability, authorship, dates, or social profiles.
- Sitemap entries must be canonical, deterministic, deduplicated, bounded, and sharded at 50,000 URLs.
- Use Bun for scripts and tests.
- Do not include unrelated historical commits or files in the replacement PR.

---

### Task 1: Create the clean delivery branch

**Files:**
- Copy: `docs/.work-items/REN-215/**`
- Copy: `docs/.work-items/REN-216/**`
- Copy: `docs/.work-items/REN-217/**`
- Copy: `docs/.work-items/REN-219/**`
- Copy: `docs/.work-items/REN-220/**`
- Copy: `docs/superpowers/specs/2026-09-12-seo-phase-one-recovery-design.md`
- Copy: `docs/superpowers/plans/2026-09-12-seo-phase-one-recovery.md`

**Interfaces:**
- Consumes: current `origin/main` and task contracts from `feat/seo-phase-1-foundation`.
- Produces: isolated branch `feat/seo-phase-1-complete` with only task-local governance/design artifacts before implementation.

- [ ] **Step 1: Create an ignored worktree from current main**

Run `git fetch origin main`, verify `.worktrees` is ignored, then create `.worktrees/seo-phase-1-complete` on `feat/seo-phase-1-complete` from `origin/main`.

- [ ] **Step 2: Copy only approved governance and design artifacts**

Use `git checkout feat/seo-phase-1-foundation -- <explicit paths>` for the seven listed artifact paths. Update each work-item branch to `feat/seo-phase-1-complete`, restore `READY_FOR_DEV`, and remove the stale failed implementation review until the new implementation is reviewed.

- [ ] **Step 3: Validate the clean starting contract**

Run all five `bun run governance:validate -- docs/.work-items/<ID>/work-item.yaml` commands. Expected: five passes.

- [ ] **Step 4: Commit**

Commit as `docs: prepare clean SEO phase one contracts`.

### Task 2: Add pure structured-data builders

**Files:**
- Create: `src/lib/seo/structured-data.ts`
- Create: `src/lib/seo/structured-data.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/(marketing)/blogs/[slug]/page.tsx`
- Modify: `src/components/shop/storefront-catalog-page.tsx`

**Interfaces:**
- Consumes: configured site identity, parsed blog records, and catalog products with `media[].mediaItem.url`.
- Produces: `buildSiteIdentityJsonLd()`, `buildBlogPostingJsonLd()`, and `buildProductItemListJsonLd()` returning serializable schema objects.

- [ ] **Step 1: Write failing builder tests**

Cover authoritative site values, unpublished-field omission, blog dates/author/image, festive `mediaItem.url`, paise-to-INR offers, availability, omitted invalid products, and absence of fabricated ratings.

- [ ] **Step 2: Run tests and verify RED**

Run `bun test src/lib/seo/structured-data.test.ts`. Expected: failure because the builders do not exist.

- [ ] **Step 3: Implement minimal pure builders**

Add typed inputs, filter invalid entries, map `mediaItem.url`, convert paise once, and omit optional values when unavailable.

- [ ] **Step 4: Integrate builders into server-rendered routes**

Replace inline JSON-LD construction in root, blog, and festive catalog paths without altering analytics or Product/Breadcrumb schema.

- [ ] **Step 5: Run tests and verify GREEN**

Run `bun test src/lib/seo/structured-data.test.ts`. Expected: all pass.

- [ ] **Step 6: Commit**

Commit as `feat: add truthful reusable SEO schema builders`.

### Task 3: Implement shop/festive metadata and heading semantics

**Files:**
- Modify: `src/app/(home)/festive/page.tsx`
- Modify: `src/app/(home)/page.tsx`
- Modify: `src/app/(marketing)/shop/layout.tsx`
- Modify: `src/app/(marketing)/shop/page.tsx`
- Modify: `src/app/(marketing)/products/[slug]/page.tsx`
- Modify: `src/app/(marketing)/blogs/[slug]/page.tsx`
- Modify: `src/components/shop/storefront-catalog-page.tsx`
- Modify: six approved homepage section files from REN-219
- Create: `scripts/seo/validate-heading-usage.ts`
- Create: `tests/seo-metadata-headings.test.ts`

**Interfaces:**
- Consumes: Next.js metadata objects and the shared `pageHeading` storefront prop.
- Produces: one H1 per approved page, clean canonicals, festive campaign metadata/art, and a deterministic heading guard.

- [ ] **Step 1: Write failing metadata and heading tests**

Assert exact metadata values and lengths, product/blog canonical generation, one homepage root H1, no section H1s, one shop/festive H1 owner, one responsive festive priority image, and unchanged `force-dynamic`.

- [ ] **Step 2: Run tests and verify RED**

Run `bun test tests/seo-metadata-headings.test.ts`. Expected: failures on current main.

- [ ] **Step 3: Implement metadata, canonical, and heading changes**

Use the approved title/description/campaign copy, add `pageHeading`, demote the six section headings, and keep the desktop hero lazy while mobile is priority.

- [ ] **Step 4: Add and run the executable heading guard**

Add `seo:validate-headings` to `package.json`; run it and expect success.

- [ ] **Step 5: Run tests and verify GREEN**

Run `bun test tests/seo-metadata-headings.test.ts`. Expected: all pass.

- [ ] **Step 6: Commit**

Commit as `feat: complete SEO metadata and heading semantics`.

### Task 4: Build canonical-safe sharded sitemap generation

**Files:**
- Create: `src/lib/seo/sitemap.ts`
- Create: `src/lib/seo/sitemap.test.ts`
- Modify: `src/app/sitemap.ts`

**Interfaces:**
- Consumes: live database rows ordered by stable identifiers and canonical route builders.
- Produces: `SITEMAP_PAGE_SIZE`, deterministic entry builders, shard count/slice helpers, `generateSitemaps()`, and bounded sitemap responses.

- [ ] **Step 1: Write failing sitemap tests**

Cover live predicates, required fixed routes, authoritative timestamps, stable sorting, URL deduplication, exclusion of category query variants, boundaries at 49,999/50,000/50,001 URLs, and bounded offset/limit behavior.

- [ ] **Step 2: Run tests and verify RED**

Run `bun test src/lib/seo/sitemap.test.ts`. Expected: failure because helpers do not exist.

- [ ] **Step 3: Implement pure sitemap helpers**

Use 50,000-entry pages, deterministic URL maps, stable sorting, and explicit fixed-route policy. Do not emit `/shop?categoryId` URLs while their canonical is `/shop`.

- [ ] **Step 4: Implement bounded Drizzle queries and Next sitemap exports**

Count live products, published blogs, and active brands; calculate shard IDs; fetch only the selected slice with stable ordering, limit, and offset; include fixed routes once.

- [ ] **Step 5: Run tests and verify GREEN**

Run `bun test src/lib/seo/sitemap.test.ts`. Expected: all pass.

- [ ] **Step 6: Commit**

Commit as `feat: add bounded canonical sitemap generation`.

### Task 5: Verify, review, and replace the PR

**Files:**
- Modify: `docs/.work-items/REN-215/REVIEW.md`, `work-item.yaml`
- Modify: `docs/.work-items/REN-216/REVIEW.md`, `work-item.yaml`
- Modify: `docs/.work-items/REN-217/REVIEW.md`, `work-item.yaml`
- Modify: `docs/.work-items/REN-219/REVIEW.md`, `work-item.yaml`
- Modify: `docs/.work-items/REN-220/REVIEW.md`, `work-item.yaml`

**Interfaces:**
- Consumes: clean base/head diff and fresh verification output.
- Produces: validated implementation reviews and replacement PR.

- [ ] **Step 1: Run focused verification**

Run structured-data, sitemap, metadata/heading tests and `bun run seo:validate-headings`.

- [ ] **Step 2: Run repository verification**

Run `bun test`, TypeScript check, formatting/diff checks, and production build. Record exact environmental failures without hiding them.

- [ ] **Step 3: Perform fresh REN-215/216/217/219/220 reviews**

Compare `origin/main...HEAD`, reconcile every contract ID, update only task-local review artifacts, and validate all five YAML files.

- [ ] **Step 4: Commit and push**

Commit review artifacts as `docs: record completed SEO implementation reviews`, push `feat/seo-phase-1-complete`, and confirm the diff contains only intended files.

- [ ] **Step 5: Open replacement PR and retire #658**

Open a PR to `main` with verification evidence. Close #658 with a link to the replacement after confirming the new PR exists.
