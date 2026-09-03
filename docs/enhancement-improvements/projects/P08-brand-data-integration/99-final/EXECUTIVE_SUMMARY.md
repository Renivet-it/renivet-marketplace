# Executive Summary — P08 Project Package

## The problem

Renivet's ~50 supplying brands run heterogeneous systems — spreadsheets, ERPs, Shopify/WooCommerce, or Unicommerce. Renivet has only one production ingestion path today (a per-brand Unicommerce inventory sync, inventory-only) and one under-used stopgap (a client-side XLSX importer, on a vulnerable dependency). No single ingestion mechanism works for every brand.

## What's recommended

Build **File-First ingestion now**: extend the existing importer (after an `xlsx` dependency upgrade) with a minimal provenance extension, exact-match-only identity resolution, human-confirmed AI-assisted schema/attribute mapping, and a dry-run/approval gate before any write. Defer, on named triggers rather than dates: a generalized API tier, a scheduled-file tier, a full reconciliation spine, and any AI-assisted SKU-matching beyond suggest-only.

## The one correction that matters most

An earlier design proposed letting AI-assisted SKU matches auto-apply when corroborated by a second signal (brand, attributes, price band), with after-the-fact audit sampling. This package's source research found that design contradicts the program's own hard rule that identity matching never auto-applies at any confidence — and that the corroborating signals are weak against exactly the costliest failure mode (matching the right product but the wrong size/color variant). The corrected, final position, carried throughout this package: any fuzzy/AI-assisted identity match is queued for human confirmation, never auto-written, until real match data, provenance, and pin-once persistence all exist (V3-gated, see `10-roadmap/V3.md`).

## A live, independent security defect

A CONFIRMED HIGH-severity cross-brand access-control gap exists today in the Unicommerce brand-settings procedures — any brand-admin can read/overwrite another brand's Unicommerce credentials. Re-verified unfixed as of 2026-08-30. Independent of the architecture decision above; should be fixed immediately. It is likely one instance of a broader portfolio-level finding (DEF-010, 51 of 104 brand-router procedures), itself currently untracked in Linear.

## The traceability gap

Zero Linear issues exist for this Epic despite the research being complete. This is the most-researched, least-tracked Epic in the portfolio.

## Verdict

POC required / GO WITH CONDITIONS — see `99-final/GO_NO_GO.md`. Not an unconditional GO: the research never authorized implementation, and Renivet's leadership has not yet decided to convert this work into tracked engineering.
