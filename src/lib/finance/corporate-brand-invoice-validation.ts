export type CorporateBrandInvoiceStatus =
    | "held"
    | "accepted"
    | "rejected"
    | "superseded";

export type CorporateFulfillmentTaxSnapshot = {
    foReference: string;
    quantity: number;
    unitRatePaise: number;
    taxableValuePaise: number;
    gstRateBps: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    totalAmountPaise: number;
    supplierGstin: string;
    recipientGstin: string;
    hsnCode: string;
};

type SnapshotInput = Pick<
    CorporateFulfillmentTaxSnapshot,
    | "foReference"
    | "quantity"
    | "unitRatePaise"
    | "gstRateBps"
    | "supplierGstin"
    | "recipientGstin"
    | "hsnCode"
>;

export type CorporateBrandInvoiceFacts = Omit<
    CorporateFulfillmentTaxSnapshot,
    "gstRateBps"
> & { gstRateBps?: number };

function normalizeReference(value: string) {
    return value.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeGstin(value: string) {
    return value.trim().toUpperCase();
}

function normalizeHsn(value: string) {
    return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function buildFulfillmentTaxSnapshot(
    input: SnapshotInput
): CorporateFulfillmentTaxSnapshot {
    const supplierGstin = normalizeGstin(input.supplierGstin);
    const recipientGstin = normalizeGstin(input.recipientGstin);
    const taxableValuePaise = input.unitRatePaise * input.quantity;
    const gstPaise = Math.round((taxableValuePaise * input.gstRateBps) / 10000);
    const intraState = supplierGstin.slice(0, 2) === recipientGstin.slice(0, 2);
    const cgstPaise = intraState ? Math.floor(gstPaise / 2) : 0;
    const sgstPaise = intraState ? gstPaise - cgstPaise : 0;
    const igstPaise = intraState ? 0 : gstPaise;

    return {
        foReference: normalizeReference(input.foReference),
        quantity: input.quantity,
        unitRatePaise: input.unitRatePaise,
        taxableValuePaise,
        gstRateBps: input.gstRateBps,
        cgstPaise,
        sgstPaise,
        igstPaise,
        totalAmountPaise: taxableValuePaise + gstPaise,
        supplierGstin,
        recipientGstin,
        hsnCode: normalizeHsn(input.hsnCode),
    };
}

export function validateBrandTaxInvoice(
    expected: CorporateFulfillmentTaxSnapshot,
    invoice: CorporateBrandInvoiceFacts
): { status: "accepted" | "held"; issues: string[] } {
    const issues: string[] = [];
    if (normalizeGstin(invoice.supplierGstin) !== expected.supplierGstin)
        issues.push(
            "Supplier GSTIN does not match the Fulfillment Order snapshot"
        );
    if (normalizeGstin(invoice.recipientGstin) !== expected.recipientGstin)
        issues.push(
            "Recipient GSTIN does not match the Fulfillment Order snapshot"
        );
    if (normalizeHsn(invoice.hsnCode) !== expected.hsnCode)
        issues.push("HSN does not match the Fulfillment Order snapshot");
    if (normalizeReference(invoice.foReference) !== expected.foReference)
        issues.push("FO reference does not match the Fulfillment Order");
    if (invoice.quantity !== expected.quantity)
        issues.push("Quantity does not match the Fulfillment Order");
    if (invoice.unitRatePaise !== expected.unitRatePaise)
        issues.push("Unit rate does not match the Fulfillment Order");
    if (invoice.taxableValuePaise !== expected.taxableValuePaise)
        issues.push("Taxable value does not match the Fulfillment Order");
    if (invoice.cgstPaise !== expected.cgstPaise)
        issues.push("CGST does not match the Fulfillment Order");
    if (invoice.sgstPaise !== expected.sgstPaise)
        issues.push("SGST does not match the Fulfillment Order");
    if (invoice.igstPaise !== expected.igstPaise)
        issues.push("IGST does not match the Fulfillment Order");
    if (invoice.totalAmountPaise !== expected.totalAmountPaise)
        issues.push("Invoice total does not match the Fulfillment Order");

    const calculatedTotal =
        invoice.taxableValuePaise +
        invoice.cgstPaise +
        invoice.sgstPaise +
        invoice.igstPaise;
    if (calculatedTotal !== invoice.totalAmountPaise)
        issues.push("Taxable value plus GST does not equal total");

    return { status: issues.length ? "held" : "accepted", issues };
}

export function assertBrandInvoiceReviewTransition(input: {
    currentStatus: CorporateBrandInvoiceStatus;
    requestedStatus: "accepted" | "rejected";
    validationIssues: string[];
    reviewReason?: string | null;
    expectedVersion: number;
    currentVersion: number;
}) {
    if (input.currentStatus !== "held")
        throw new Error("BRAND_INVOICE_REVIEW_STATE_INVALID");
    if (
        input.requestedStatus === "accepted" &&
        input.validationIssues.length > 0 &&
        !input.reviewReason?.trim()
    )
        throw new Error("BRAND_INVOICE_OVERRIDE_REASON_REQUIRED");
    if (input.expectedVersion !== input.currentVersion)
        throw new Error("BRAND_INVOICE_STALE_REVIEW");
}
