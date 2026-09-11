# P08 — Brand Data & Commerce Integration Platform

## What this package is

This is the SRS-grade project-definition package for Epic P08 in Renivet's Enhancement & Improvements program. It packages and restructures an already-completed 16-phase research program (`docs/research/brand-commerce-integration/`) into the program's standard project template. **It does not re-derive the research from scratch** — every substantive claim in this package cites its source wave document. Where this package adds anything beyond translation, it is marked as package-level addition, not new research.

## Why P08 is different from the other four Epics

Every other Epic in this program (P01, P02, P05, P06) required this package's authors to synthesize a project definition from scattered audit findings and portfolio documents. P08 instead inherits a complete, adversarially-reviewed research program: 16 waves of investigation, a dedicated critic pass (`14-critic/`, four documents), and a synthesis (`15-synthesis/SYNTHESIS.md`) that already resolved a real internal contradiction the research found in itself (see `11-critique/` and `05-algorithms/DECISION_LOGIC.md`). The job here is fidelity, not invention: preserve the research's conclusions, its classification discipline (CONFIRMED / INFERRED / UNKNOWN), and its explicit refusal to over-build, while filling in the SRS structure the program requires of every Epic.

## One-paragraph summary

Renivet's ~50 supplying brands run heterogeneous systems (spreadsheets, ERPs, Shopify/WooCommerce, Unicommerce), and Renivet currently has only one production ingestion path (a per-brand Unicommerce inventory sync) plus one under-used stopgap (a client-side XLSX/CSV importer). The recommended architecture is a **Scoped Hybrid**: build File-First ingestion now — catalog, SKU/variant, price, inventory, and media import with a minimal provenance extension, exact-match-only identity resolution, and human-confirmed AI assistance for schema/attribute mapping — while explicitly deferring a generalized API tier, a scheduled-file tier, a full reconciliation spine, and AI-assisted SKU auto-matching until named triggers fire. A verified HIGH-severity access-control defect in the existing Unicommerce integration (F10) is independent of this architecture decision and should be fixed immediately regardless of which ingestion design Renivet chooses.

## How to read this package

- Start with `99-final/EXECUTIVE_SUMMARY.md` and `99-final/GO_NO_GO.md` for the verdict.
- `00-context/` and `01-research/` orient you in the existing research and current system state.
- `02-business-customer/` through `09-validation/` are the SRS body.
- `10-roadmap/` states V1/V2/V3 scope and the exact triggers that move work from one to the next — reuse these triggers verbatim; do not invent new ones.
- `11-critique/` carries the research program's own adversarial review forward, plus this package's own review of the packaging exercise itself.
- `12-traceability/` is deliberately the least reassuring section in this package: it documents that zero Linear tracking exists for this Epic despite the research being complete.

## Source of truth

The canonical research lives at `docs/research/brand-commerce-integration/`. If anything in this package appears to conflict with that research, the research is authoritative and this package has a translation error — file a correction against this package, not the research.
