# Semantic Search Vector Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep public product search semantically useful when Advanced RAG returns no candidates by querying stored product vectors.

**Architecture:** Preserve Advanced RAG as the first candidate source. When it yields no IDs, generate the query's 768-dimension embedding and retrieve nearest products from `semantic_search_embeddings`; retain the existing text predicate if vector search is unavailable or empty. Reuse the resulting ordered IDs for filtering and relevance ordering.

**Tech Stack:** TypeScript, Drizzle ORM, PostgreSQL pgvector, Bun.

**Spec:** Conversation request and the read-only root-cause analysis.

## Global Constraints

- Use Bun for scripts and tests.
- Keep the public catalog eligibility filters intact.
- Do not change the external RAG response contract.

## Review Focus

- RAG candidates retain priority over local vector candidates.
- Empty or failing vector search still falls back to text search.
- Vector distance order is retained in the product results.
- Public eligibility filters continue to apply after candidate selection.

### Task 1: Add Local Vector Candidate Fallback

**Files:**
- Modify: `src/lib/db/queries/product.ts`
- Modify: `src/lib/db/queries/product-search-predicate.ts`
- Test: `src/lib/db/queries/product-search-predicate.test.ts`

- [x] Add a failing predicate test showing local vector IDs are used when RAG IDs are absent.
- [x] Run the focused test and confirm it fails for the missing vector candidate behavior.
- [x] Add vector candidate selection after RAG returns no IDs; swallow provider/query failures so text fallback remains available.
- [x] Run the focused test and full `bun test` suite.

### Follow-up: Search and Discovery Reliability

- [x] Route only exact brand/category intents to dedicated destinations; retain other queries for global product search.
- [x] Recognize singular/plural brand names and use the full brand catalog rather than a limited RAG candidate list.
- [x] Combine word-based local matches with semantic candidates, including taxonomy and metadata for products without vectors.
- [x] Match color queries against product titles/options, avoiding substring matches such as red/checkered.
- [x] Validate provider product UUIDs and parameterize relevance ordering.
- [x] Apply catalog eligibility before local vector candidate selection.
- [x] Use the catalog query for header previews, and label similar-only and catalog discovery fallbacks.
- [x] Verify against the configured catalog: brand count 15 equals brand-filter count 15; pagination 8+7 without overlap; saree query 50 results; provider outage retains keyword results; unknown query gets discovery results; header returns four images.
- [x] Final full test run: 880 passed, 4 skipped, 0 failed. TSX syntax compilation passed. Full TypeScript checking did not complete, and browser automation was blocked by URL verification policy.
