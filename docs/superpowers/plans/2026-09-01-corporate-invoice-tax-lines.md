# Corporate Invoice Tax Lines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct corporate invoice line splitting, GST rate selection, manual quote GSTIN capture, and proforma dates.

**Architecture:** Keep tax derivation in `src/lib/finance/calculations.ts`, using only the net base-garment unit value for apparel threshold logic. Pass separately calculated base and customisation amounts through corporate document mappers to the existing shared commercial template and tax-invoice adapter, retaining safe fallbacks for historic orders.

**Tech Stack:** Next.js 15, TypeScript, React, React-PDF, tRPC, Drizzle, Zod, Bun.

**Spec:** `docs/superpowers/specs/2026-09-01-corporate-invoice-tax-lines-design.md`

## Global Constraints

- Use Bun for scripts and tests.
- Do not validate the manual quote Customer GSTIN with a GSTIN regex.
- Never use `subtotalPaise + customizationPaise` to choose the garment GST rate.
- Preserve historic document rendering where persisted split amounts are absent.

---

### Task 1: Per-piece GST calculation

**Files:**
- Modify: `src/lib/finance/calculations.ts:118-128`
- Create: `src/lib/finance/calculations.test.ts`

**Interfaces:**
- Produces: `deriveGstRateBps({ hsnCode, fallbackRateBps, unitPricePaise }): number`, where `unitPricePaise` is an excluding-GST, base-goods per-piece value.

- [ ] **Step 1: Write the failing rate-selection tests**

```ts
import { describe, expect, test } from "bun:test";
import { deriveGstRateBps } from "./calculations";

describe("deriveGstRateBps", () => {
  test("uses the base garment's net per-piece value", () => {
    expect(deriveGstRateBps({ hsnCode: "6109", unitPricePaise: 99_900 })).toBe(500);
    expect(deriveGstRateBps({ hsnCode: "6109", unitPricePaise: 100_100 })).toBe(1200);
  });

  test("keeps a configured rate for non-apparel HSNs", () => {
    expect(deriveGstRateBps({ hsnCode: "9988", unitPricePaise: 10_000, fallbackRateBps: 1800 })).toBe(1800);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `bun test src/lib/finance/calculations.test.ts`

Expected: the apparel threshold expectation fails because the existing function uses the incorrect threshold/rate.

- [ ] **Step 3: Implement the minimal threshold correction**

```ts
if (/^(61|62|63)/.test(normalizedHsn)) {
  return params.unitPricePaise <= 100_000 ? 500 : 1200;
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `bun test src/lib/finance/calculations.test.ts`

Expected: 2 passing tests.

### Task 2: Persist manual-quote GSTIN and correct tax inputs

**Files:**
- Modify: `src/components/corporate-platform/admin-manual-quote-modal.tsx:120-310`
- Modify: `src/lib/trpc/routes/general/corporate-platform.ts:createManualQuote`
- Modify: `src/lib/validations/corporate-platform.ts:createManualQuoteInputSchema`
- Test: `src/lib/finance/calculations.test.ts`

**Interfaces:**
- Consumes: `deriveGstRateBps` from Task 1.
- Produces: `createManualQuote` payload with `gstNumber: string | null`, `baseGstRateBps`, `baseGstPaise`, `customizationGstRateBps`, and `customizationGstPaise` saved in the quote/order pricing snapshot.

- [ ] **Step 1: Add a failing payload/schema test**

```ts
test("manual quote accepts an entered GSTIN without regex validation", () => {
  const parsed = createManualQuoteInputSchema.parse({ ...validManualQuote, gstNumber: "buyer-provided-gstin" });
  expect(parsed.gstNumber).toBe("buyer-provided-gstin");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `bun test src/lib/validations/corporate-platform.test.ts`

Expected: failure because the input does not yet expose `gstNumber`.

- [ ] **Step 3: Add the Customer GSTIN field and payload mapping**

```tsx
<CompactInput label="Customer GSTIN" value={gstNumber} onChange={setGstNumber} placeholder="Enter buyer GSTIN" />
```

Add `gstNumber: z.string().trim().max(64).nullable().optional()` to the server input, pass `gstNumber.trim() || null` from the modal, and save it to the corporate quote/order and company snapshot. Do not add a regex refinement or make the field a submit requirement.

- [ ] **Step 4: Pass the correct base value into tax derivation**

Keep `unitPricePaise` as the base net amount when invoking `deriveGstRateBps`; do not substitute `taxablePaise / qtyNum` or include `extrasBreakdown.totalCustomizationPaise`. Calculate base and customisation tax separately and write both amounts/rates into the pricing snapshot.

- [ ] **Step 5: Run focused tests**

Run: `bun test src/lib/finance/calculations.test.ts src/lib/validations/corporate-platform.test.ts`

Expected: all focused tests pass.

### Task 3: Render split lines and safe proforma dates

**Files:**
- Modify: `src/lib/services/corporate-documents.ts:corporate document data mappers`
- Modify: `src/components/pdf/corporate-commercial-document-template.tsx:201-760`
- Modify: `src/components/pdf/corporate-tax-invoice-template.tsx:100-300`
- Create: `src/components/pdf/corporate-document-data.test.ts`

**Interfaces:**
- Consumes: persisted base/customisation rates and amounts from Task 2.
- Produces: shared template `items` with a base garment item and an optional customisation item; a valid `documentDate` string/Date for proforma rendering.

- [ ] **Step 1: Write failing document-data tests**

```ts
test("adds a customisation row without changing the base unit value", () => {
  const document = buildCorporateCustomerDocumentData(orderWithCustomization);
  expect(document.items).toHaveLength(2);
  expect(document.items[0].product.price).toBe(40_000);
  expect(document.items[1].product.title).toBe("Customization / Extras");
});

test("uses a persisted or created proforma date when issueDate is invalid", () => {
  expect(resolveCorporateDocumentDate({ issueDate: "Invalid Date", createdAt: new Date("2026-09-01") })).toEqual(new Date("2026-09-01"));
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `bun test src/components/pdf/corporate-document-data.test.ts`

Expected: failures because mapper helpers and split item output do not yet exist.

- [ ] **Step 3: Create date and split-line helpers in the document service**

```ts
export function resolveCorporateDocumentDate(input: { issueDate?: Date | string | null; createdAt?: Date | string | null }) {
  for (const value of [input.issueDate, input.createdAt]) {
    const date = value ? new Date(value) : null;
    if (date && !Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}
```

Build base and optional customisation line objects from persisted split amounts. For legacy records, derive the customisation tax as total tax less independently calculated base tax, clamped to zero.

- [ ] **Step 4: Use the helpers in both customer invoice adapters**

Make `CorporateTaxInvoiceTemplate` append a customisation item when `customizationPaise > 0`, instead of embedding it in the base description. Make the proforma/commercial document mapper pass the same two item rows. Replace direct invalid-date formatting with `resolveCorporateDocumentDate`.

- [ ] **Step 5: Run focused tests and render the preview**

Run: `bun test src/components/pdf/corporate-document-data.test.ts`

Run: `bun run src/scripts/render-corporate-document-chain-previews.tsx`

Expected: focused tests pass and generated proforma/tax invoice have two rows and no `Invalid Date`.

### Task 4: Regression verification

**Files:**
- Verify: changed source and test files from Tasks 1-3

- [ ] **Step 1: Run the repository test suite**

Run: `bun test`

Expected: exit code 0.

- [ ] **Step 2: Render and inspect corporate PDF previews**

Run: `bun run src/scripts/render-corporate-document-chain-previews.tsx`

Expected: every customer-facing corporate document that displays customisation uses a separate row; proforma displays a valid date.

- [ ] **Step 3: Review the final diff**

Run: `git diff --check` and `git diff -- src/lib/finance/calculations.ts src/components/corporate-platform/admin-manual-quote-modal.tsx src/lib/trpc/routes/general/corporate-platform.ts src/lib/services/corporate-documents.ts src/components/pdf/corporate-commercial-document-template.tsx src/components/pdf/corporate-tax-invoice-template.tsx`

Expected: no whitespace errors and no changes outside the approved scope.
