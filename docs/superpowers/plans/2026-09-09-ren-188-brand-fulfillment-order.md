# REN-188 Brand Fulfillment Order Operational Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Brand Fulfillment Order PDF operationally complete using stored supplier, customer, delivery, production, QC, and shipment data.

**Architecture:** Keep the protected PDF route as the read-only data boundary and extend the shared React PDF template with optional structured operational sections. Preserve the existing persisted financial snapshot and authorization checks; optional values render as unavailable when absent.

**Tech Stack:** Next.js route handler, Drizzle ORM, React PDF, TypeScript, Bun tests.

**Spec:** `docs/.work-items/REN-188/SPEC.md`

## Global Constraints

- Use existing stored order/brand/FO/shipment/QC/customization data only.
- Do not change tax determination, pricing, totals, document numbering, permissions, schemas, or state mutations.
- Missing optional values remain blank or unavailable; no synthetic dates, statuses, addresses, or instructions.
- Run `bun test` and `bun run governance:validate -- docs/.work-items/REN-188/work-item.yaml`.

---

### Task 1: Define tested operational-data mapping

**Files:**
- Create: `src/app/api/corporate-orders/[id]/vendor-po-data.ts`
- Create: `tests/ren-188-brand-fulfillment-order.test.ts`

**Interfaces:**
- Consumes: Stored order, brand, fulfillment-order, QC, shipment, and configuration values.
- Produces: A pure `buildBrandFulfillmentOrderSections(input)` mapper returning supplier, customer, delivery, production, QC, and shipment display data with unavailable optional fields.

- [ ] **Step 1: Write the failing tests** for complete data, missing optional data, and preservation of financial snapshot values.
- [ ] **Step 2: Run `bun test tests/ren-188-brand-fulfillment-order.test.ts`** and confirm failure because the mapper is not defined.
- [ ] **Step 3: Implement the pure mapper** with explicit labels and no fallback date/status generation.
- [ ] **Step 4: Run the focused test again** and confirm all mapping tests pass.
- [ ] **Step 5: Commit** the mapper and tests with `feat: map REN-188 fulfillment order sections`.

### Task 2: Load existing QC and shipment records in the protected route

**Files:**
- Modify: `src/app/api/corporate-orders/[id]/vendor-po.pdf/route.tsx`
- Modify: `src/app/api/corporate-orders/[id]/vendor-po-data.ts`
- Test: `tests/ren-188-brand-fulfillment-order.test.ts`

**Interfaces:**
- Consumes: Existing authorization gate and Drizzle reads for the order, latest QC submission, and shipment.
- Produces: Mapper input populated from persisted records; no writes or authorization changes.

- [ ] **Step 1: Add a failing route-shape regression assertion** proving latest QC/shipment data is passed into the mapping boundary.
- [ ] **Step 2: Run the focused test** and confirm the route does not yet satisfy the assertion.
- [ ] **Step 3: Add read-only latest QC and shipment queries** after the existing authorization check and pass their values to the mapper.
- [ ] **Step 4: Remove the current synthetic expected-delivery default** so missing stored dates remain unavailable.
- [ ] **Step 5: Run focused tests and the existing corporate document tests** to confirm route and financial behavior remain compatible.
- [ ] **Step 6: Commit** with `feat: load operational data for REN-188 fulfillment orders`.

### Task 3: Render structured operational sections in the PDF

**Files:**
- Modify: `src/components/pdf/corporate-commercial-document-template.tsx`
- Modify: `src/app/api/corporate-orders/[id]/vendor-po.pdf/route.tsx`
- Test: `tests/ren-188-brand-fulfillment-order.test.ts`

**Interfaces:**
- Consumes: Structured mapper output and existing `CorporateCommercialDocumentData` financial fields.
- Produces: PDF sections labelled `FULFILLED BY`, `CORPORATE CUSTOMER`, `DELIVER TO`, `PRODUCTION & CUSTOMIZATION`, `QUALITY CONTROL`, and `DELIVERY & SHIPMENT`.

- [ ] **Step 1: Add failing assertions** for the exact section labels, stored values, QC status, shipment identifiers, and unavailable rendering.
- [ ] **Step 2: Run the focused test** and confirm the labels/sections are absent.
- [ ] **Step 3: Extend the template data type with optional structured operational sections** and render them without altering tax/table calculations.
- [ ] **Step 4: Wire the route mapper output into the template** while retaining current references, totals, document number, and authorization.
- [ ] **Step 5: Run focused tests plus `bun test`** and confirm the complete suite passes.
- [ ] **Step 6: Commit** with `feat: render REN-188 operational fulfillment sections`.

### Task 4: Review, validate, and hand off

**Files:**
- Modify: `docs/.work-items/REN-188/work-item.yaml`
- Create/modify: `docs/.work-items/REN-188/REVIEW.md`

- [ ] **Step 1: Inspect the final diff against `origin/master`** for scope, authorization, and financial invariants.
- [ ] **Step 2: Run `bun test` and governance validation** with fresh output.
- [ ] **Step 3: Run the Renivet implementation review** and record requirements, scenarios, invariants, and staging/manual verification status.
- [ ] **Step 4: Commit review artifacts** only after validation passes.

## Self-review checklist

- REQ-188-001 through REQ-188-003 are covered by Task 3 labels and Task 1 mapping tests.
- REQ-188-004 through REQ-188-006 are covered by Tasks 1–3 and stored-record route reads.
- REQ-188-007 is covered by missing-data tests and removal of the synthetic date.
- REQ-188-008 is covered by existing corporate document regression tests and the unchanged financial template path.
- No schema, migration, tax, authorization, or production configuration work is planned.
