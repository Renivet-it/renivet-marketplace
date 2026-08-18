import {
    computeTdsDeduction,
    deriveGstRateBps,
    splitGstByState,
} from "@/lib/finance/calculations";
import {
    defaultBrandInvoiceCode,
    brandFinancialYearCode,
} from "@/lib/services/corporate-documents";
import {
    corporateOrderFormInputSchema,
    corporateGstinValidation,
} from "@/lib/validations/corporate-order";

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

console.log("=== RUNNING VERIFICATION FOR CORPORATE BUILD SPEC V5.0 ===");

// 1. Test BUG-001 GST apparel threshold and rates
console.log("\n1. Testing GST Apparel Rates (BUG-001)...");
const apparelLow = deriveGstRateBps({
    hsnCode: "61099010",
    unitPricePaise: 250_000, // Rs 2,500
});
assert(apparelLow === 500, `Apparel <= Rs 2,500 must be 500 bps (5%), got ${apparelLow}`);

const apparelHigh = deriveGstRateBps({
    hsnCode: "62034200",
    unitPricePaise: 250_100, // Rs 2,501
});
assert(apparelHigh === 1800, `Apparel > Rs 2,500 must be 1800 bps (18%), got ${apparelHigh}`);

const chapter63 = deriveGstRateBps({
    hsnCode: "63022100", // Textile made-ups
    unitPricePaise: 200_000,
});
assert(chapter63 === 500, `Chapter 63 <= Rs 2,500 must be 500 bps (5%), got ${chapter63}`);
console.log("✓ GST Apparel & Chapter 63 rates validated!");

// 2. Test BUG-003 TDS rates & entity-type thresholds
console.log("\n2. Testing TDS §194-O (BUG-003)...");
const companyTds = computeTdsDeduction({
    cumulativeCommissionPaise: 0,
    cycleCommissionPaise: 1_200_000, // Rs 12,000 commission
    entityType: "company",
});
assert(companyTds.deductiblePaise === 1200, `Company TDS at 0.1% of Rs 12,000 should be Rs 12 (1200 paise), got ${companyTds.deductiblePaise}`);

const individualTdsBelow = computeTdsDeduction({
    cumulativeCommissionPaise: 20_000_000, // Rs 2,00,000 (below 5L)
    cycleCommissionPaise: 1_000_000, // Rs 10,000
    entityType: "individual",
});
assert(individualTdsBelow.deductiblePaise === 0, `Individual below 5L threshold should have Rs 0 TDS, got ${individualTdsBelow.deductiblePaise}`);
console.log("✓ TDS 0.1% and entity-type threshold logic validated!");

// 3. Test GST State Split (BUG-005)
console.log("\n3. Testing GST State Split (BUG-005)...");
const intraState = splitGstByState({
    taxableValuePaise: 6_000_000, // Rs 60,000
    gstRateBps: 500, // 5% = Rs 3,000
    supplierState: "Karnataka",
    customerState: "Karnataka",
});
assert(intraState.cgstPaise === 150_000, `CGST should be Rs 1,500, got ${intraState.cgstPaise}`);
assert(intraState.sgstPaise === 150_000, `SGST should be Rs 1,500, got ${intraState.sgstPaise}`);
assert(intraState.igstPaise === 0, `IGST should be 0 for intra-state, got ${intraState.igstPaise}`);

const interState = splitGstByState({
    taxableValuePaise: 6_000_000, // Rs 60,000
    gstRateBps: 500, // 5% = Rs 3,000
    supplierState: "Maharashtra",
    customerState: "Karnataka",
});
assert(interState.igstPaise === 300_000, `IGST should be Rs 3,000 for inter-state, got ${interState.igstPaise}`);
assert(interState.cgstPaise === 0 && interState.sgstPaise === 0, "CGST and SGST should be 0 for inter-state");
console.log("✓ GST State splitting validated!");

// 4. Test Brand Invoice Number formatting
console.log("\n4. Testing Brand Sequence format...");
const code = defaultBrandInvoiceCode("Bamboo Organics", "a1b2c3d4-e5f6-7890-abcd-ef123456789a");
assert(code === "BAMA", `Brand invoice code should be BAMA, got ${code}`);
const fy = brandFinancialYearCode(new Date("2026-08-18"));
console.log(`FY Code: ${fy}`);
assert(fy === "2627", `FY code for Aug 2026 should be 2627, got ${fy}`);
console.log("✓ Brand invoice sequence format validated!");

// 5. Test GSTIN Regex (VAL-004)
console.log("\n5. Testing GSTIN Regex validation (VAL-004)...");
const validGstin = "29ABCDE1234F1Z5";
const invalidGstin = "123INVALID";
assert(corporateGstinValidation.safeParse(validGstin).success === true, "Valid GSTIN should pass");
assert(corporateGstinValidation.safeParse(invalidGstin).success === false, "Invalid GSTIN should fail");
assert(corporateGstinValidation.safeParse(null).success === true, "Null GSTIN should pass (optional)");
console.log("✓ GSTIN Regex validation validated!");

// 6. Test Manual Quote Input Validation with HSN & Extras
console.log("\n6. Testing Manual Quote Input with HSN & Extras...");
const { corporateAdminManualQuoteInputSchema } = await import(
    "@/lib/validations/corporate-platform"
);
const validQuote = corporateAdminManualQuoteInputSchema.safeParse({
    companyName: "Acme Corp",
    contactPerson: "John Doe",
    email: "john@acme.com",
    phone: "9876543210",
    brandId: "a1b2c3d4-e5f6-7890-abcd-ef123456789a",
    hsnCode: "61091000",
    extraChargeRuleIds: ["b1b2c3d4-e5f6-7890-abcd-ef123456789b"],
    manualExtraAmountPaise: 50000,
    manualExtraDescription: "Custom premium foil packaging",
    quantity: 100,
    unitPricePaise: 40000,
    customizationCostPaise: 65000,
    commissionAmountPaise: 250000,
    commissionGstPercent: 18,
    gstPercent: 5,
    advancePercent: 30,
});
assert(validQuote.success === true, "Valid manual quote with HSN, extras and commission should pass");
assert(
    validQuote.data?.commissionAmountPaise === 250000,
    "Commission amount must be preserved"
);
assert(
    validQuote.data?.commissionGstPercent === 18,
    "Commission GST percent must be preserved"
);
console.log("✓ Manual quote with HSN, Extras, and Commission fields validated!");

console.log("\n🎉 ALL CORPORATE BUILD SPEC V5.0 VERIFICATIONS PASSED SUCCESSFULLY!");

