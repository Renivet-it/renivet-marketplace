# Software Requirements Specification — P08: Brand Data & Commerce Integration Platform

This SRS consolidates the package; each section below points to the file(s) that hold the full detail rather than repeating it. Read this as the index-with-teeth for the package, not a summary that stands alone.

## 1. Purpose and scope

Bring brand-supplied product, inventory, price, and media data into Renivet's canonical model from heterogeneous brand systems, without requiring every brand to adopt a new system. Out of scope: orders, fulfillment, returns, any OMS/ERP-replacement functionality. See `00-context/BUSINESS_CONTEXT.md`.

## 2. Current state

One production ingestion path (Unicommerce inventory sync, inventory-only), one under-used stopgap (client-side XLSX importer, vulnerable dependency), partial provenance, partial media normalization, and a CONFIRMED HIGH-severity cross-brand access-control gap (F10), re-verified unfixed as of 2026-08-30. See `00-context/CURRENT_STATE.md`.

## 3. Stakeholders and personas

Four INFERRED personas (Priya, Rahul, Ananya, Karan) spanning spreadsheet-only to API-capable brands, plus the currently-unstaffed Renivet catalog-ops role. See `02-business-customer/PERSONAS.md`.

## 4. Requirements

Business requirements (BR-1 to BR-7), functional requirements (FR-1 to FR-17), non-functional requirements (NFR-1 to NFR-10), business rules (BRule-1 to BRule-11), and acceptance criteria (AC-1 to AC-31) are fully specified in `03-requirements/`. All are V1-scoped; V2/V3 scope lives in `10-roadmap/`.

## 5. Architecture

Recommended: a Scoped Hybrid — File-First ingestion converging with the existing (access-control-fixed) Unicommerce sync on one shared write path, with exact-match-only identity resolution and human-confirmed AI assistance. Full diagrams, component responsibilities, data flow, and lifecycle state machine in `04-architecture/`.

## 6. Algorithms and the corrected AI-matching decision

Identity resolution is exact-match-only in V1; a superseded design would have let AI-corroborated fuzzy matches auto-apply with audit sampling, which the research's own critic pass found contradicts its hard guardrail rule. The corrected rule — any fuzzy/AI-assisted match queues for human confirmation, never auto-writes — governs from V1 through V3. Full detail in `05-algorithms/`.

## 7. Data architecture

The smallest safe V1 data design is **import-batch + import-record** (evaluated against staging-table-only and change-set/event-model alternatives). Full comparison and schema contracts in `06-data/`.

## 8. Feasibility

Engineering-cost-low, reuse-heavy V1; a genuine, currently-unresolved staffing gap for manual-review operations at volume; an AI feasibility walk (deterministic → existing mapping → fuzzy/statistical → AI-assist → human review) applied per use case; MCP explicitly not applicable (this is a batch problem, not an interactive-agent problem). Full detail in `07-feasibility/`.

## 9. Reliability and security

Exhaustive tenant-isolation requirements across every new surface this Epic introduces; the F10 defect and its likely (INFERRED) relationship to the portfolio's broader DEF-010 finding; the required failure matrix reusing the research's own 10 named POC failure scenarios. Full detail in `08-reliability/`.

## 10. Validation

Test strategy built directly on the failure matrix and acceptance criteria; no classic experiment/A-B strategy applies (internal tooling, not a customer-facing split test); success metrics reuse the research's own POC success bar (closing F4 and F7), not brand-tier coverage breadth. Full detail in `09-validation/`.

## 11. Roadmap

V1 = exactly Phase 1 of the research. V2/V3 components are gated on five named triggers, none of them dates. Full detail and the authoritative trigger table in `10-roadmap/`.

## 12. Critique

The research's own architecture, business, and anti-overengineering critiques are carried forward, plus this package's own critique of its RDBMS/AI-feasibility depth additions. Full detail in `11-critique/`.

## 13. Traceability

Zero Linear tracking exists for this Epic. Full detail, including the DEF-010 cross-reference, in `12-traceability/`.

## 14. Verdict

GO WITH CONDITIONS, pending a Renivet leadership decision to convert this package into tracked work, and independent of the F10 fix which should proceed immediately regardless. Full detail in `99-final/GO_NO_GO.md` and `99-final/OPEN_DECISIONS.md`.
