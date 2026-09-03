# System Architecture — P01

No target architecture document existed for search before this pass (CONFIRMED absence). This Epic hardens the existing architecture rather than redesigning it — the "current" and "target" diagrams below are nearly identical by design; differences are annotated.

## Current architecture (CONFIRMED)

```mermaid
flowchart TD
    A[Customer: search bar input] -->|typing| B["/api/search/suggestions (REST)"]
    B -->|GET /suggestions/ai-suggestions, no timeout| EXT[External ML/Search Microservice\nhttp://64.227.137.174:8000]
    EXT -->|suggestion list or empty on error| B --> A

    A -->|submit / Enter| C["tRPC search.processSearch\n(search-engine.ts, Subsystem B)"]
    C --> C1[normalizeQuery]
    C1 --> C2{detectBrandIntent}
    C2 -->|matched| C3[return BRAND result + redirectUrl]
    C2 -->|no match| C4{detectIntentFromMapping}
    C4 -->|matched| C5[return CATEGORY/SUBCATEGORY/PRODUCT_TYPE + redirectUrl]
    C4 -->|no match| C6{detectCategoryIntentFallback}
    C6 -->|matched| C5
    C6 -->|no match| C7[return UNKNOWN]
    C3 --> LOG[logSearchQuery -> searchAnalytics]
    C5 --> LOG
    C7 --> LOG
    LOG --> D["onSuccess in product-search.tsx"]
    D -->|BUG: redirectUrl discarded, REN-149| E["navigateToCatalogWithSearch(originalQuery)\nALWAYS -> /shop?search=..."]

    E --> F["getProducts() in product.ts\n(Subsystem A)"]
    F --> F1{exact brand name match?}
    F1 -->|yes| F2[filter by brandId, skip external call]
    F1 -->|no| F3[getEmbedding 384d]
    F3 --> F4[brand pgvector distance query]
    F3 -.sequential today, REN-151.-> F5["fetch RAG /search/advanced-rag\nno timeout, REN-146"]
    F4 --> F6[build ILIKE+EXISTS fallback predicate\nalways built even if RAG succeeded, REN-158]
    F5 --> F6
    F6 --> F7["WHERE: inArray(ragIds) OR ilikeFallback"]
    F7 --> F8[apply filters: price/active/color/size/discount/requireMedia]
    F8 --> F9["Promise.all: findMany + count()\n(REN-83, already parallel)"]
    F9 --> F10["app-level media-URL re-filter\nif requireMedia (runs AFTER count, REN-155)"]
    F10 --> G[Return data + count to shop page]

    style E fill:#f66,color:#000
    style F5 fill:#f66,color:#000
    style F6 fill:#fa6,color:#000
    style F10 fill:#fa6,color:#000
```

Red = confirmed defect (behavior wrong). Orange = confirmed inefficiency (behavior correct, cost avoidable).

## Target architecture (post-Epic)

Only four edges change; everything else is identical to current-state, which is the point — this is hardening, not redesign.

```mermaid
flowchart TD
    A[Customer: search bar input] --> B["/api/search/suggestions (REST)\nnow with explicit timeout"]
    B -->|bounded call| EXT[External ML/Search Microservice\nTLS + env-driven URL]

    A -->|submit| C[tRPC search.processSearch]
    C --> LOG[logSearchQuery -> searchAnalytics]
    LOG --> D[onSuccess in product-search.tsx]
    D -->|FIXED, REN-149| E{intentType}
    E -->|BRAND/CATEGORY/SUBCATEGORY/PRODUCT_TYPE| E1[navigate to result.redirectUrl]
    E -->|UNKNOWN| E2["navigateToCatalogWithSearch(originalQuery)"]

    E1 --> F[getProducts / category listing]
    E2 --> F
    F --> F1{exact brand match?}
    F1 -->|yes| F2[filter by brandId]
    F1 -->|no| F34["Promise.all: brand-embedding+match, RAG fetch\n(FIXED, REN-151, both bounded by timeout)"]
    F34 --> F7{ragProductIds.length > 0?}
    F7 -->|yes| F7a["WHERE: inArray(ragIds) only\n(FIXED, REN-158)"]
    F7 -->|no| F7b[build ILIKE fallback]
    F7a --> F8[apply filters]
    F7b --> F8
    F8 --> CACHE{category-only or category+sort,\nno free-text search?}
    CACHE -->|yes, cache hit| CHIT[serve from Redis cache\nFIXED, REN-159]
    CACHE -->|no, or miss| F9["Promise.all: findMany + count()"]
    F9 --> F10["media-URL re-filter BEFORE final count\n(FIXED, REN-155)"]
    CHIT --> G[Return data + count]
    F10 --> G
    G --> CLICK["click -> logSearchClick persists event\n(FIXED, REN-154)"]

    style E1 fill:#6c6,color:#000
    style F34 fill:#6c6,color:#000
    style F7a fill:#6c6,color:#000
    style F10 fill:#6c6,color:#000
    style CHIT fill:#6c6,color:#000
    style CLICK fill:#6c6,color:#000
```

Green = fixed by this Epic's issues.

## What is deliberately unchanged

- The external ML/search microservice itself: not replaced, not retrained, not brought in-house.
- The intent-classification priority order (brand → mapping table → fallback).
- The RAG-relevance-vs-explicit-sort suppression logic (`shouldApplySearchRelevanceOrdering`, SE-F002's existing fix).
- pgvector's role: still brand-matching only; product-level embeddings remain written-but-unused (no requirement in this Epic proposes activating them — see `07-feasibility/ALTERNATIVES.md`).
