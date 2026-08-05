import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
    const [
        { db },
        schema,
        { eq },
        { corporateDocumentService },
        { corporateOrderService },
    ] = await Promise.all([
        import("@/lib/db"),
        import("@/lib/db/schema"),
        import("drizzle-orm"),
        import("@/lib/services/corporate-documents"),
        import("@/lib/services/corporate-order"),
    ]);
    const order = await db.query.corporateOrders.findFirst({
        where: eq(schema.corporateOrders.publicOrderId, "TEST-CORP-20X20-30"),
    });
    if (!order?.brandId) throw new Error("Run the corporate test seed first");
    const brandDetails = await db.query.brandConfidentials.findFirst({
        where: eq(schema.brandConfidentials.id, order.brandId),
    });
    if (!brandDetails?.gstin)
        throw new Error("The test supplier brand needs a GSTIN");

    const vendorPo = await corporateDocumentService.issueVendorPurchaseOrder(
        order.userId,
        {
            orderId: order.id,
            unitBuyPricePaise: 1_500,
            gstRateBps: 1_800,
            expectedDeliveryDate: "2026-08-18",
            deliveryMode: "direct_to_customer",
            paymentTerms:
                "Payment after validation of the supplier tax invoice.",
            deliveryInstructions:
                "Ship directly to the corporate customer after Renivet QC approval.",
        }
    );
    let brandInvoice = await db.query.corporateBrandTaxInvoices.findFirst({
        where: eq(schema.corporateBrandTaxInvoices.orderId, order.id),
    });
    if (!brandInvoice) {
        brandInvoice = await corporateDocumentService.recordBrandTaxInvoice(
            order.userId,
            {
                orderId: order.id,
                vendorPurchaseOrderId: vendorPo.id,
                invoiceNumber: "TEST-BRAND-TI-20X20",
                invoiceDate: "2026-08-18",
                supplierGstin: brandDetails.gstin,
                recipientGstin: "10AANCR5687A1ZG",
                hsnCode: "6109",
                taxableValuePaise: vendorPo.taxableValuePaise,
                cgstPaise: vendorPo.cgstPaise,
                sgstPaise: vendorPo.sgstPaise,
                igstPaise: vendorPo.igstPaise,
                totalAmountPaise: vendorPo.totalAmountPaise,
                file: {
                    name: "test-brand-tax-invoice.pdf",
                    url: "https://example.invalid/test-brand-tax-invoice.pdf",
                    type: "application/pdf",
                    size: 1,
                    key: "test-brand-tax-invoice-no-upload",
                },
            }
        );
    }
    if (brandInvoice.validationStatus !== "validated") {
        brandInvoice = await corporateDocumentService.reviewBrandTaxInvoice({
            invoiceId: brandInvoice.id,
            validationStatus: "validated",
            gstr2bStatus: "matched",
            reviewNotes: "Validated test invoice; no external message sent.",
        });
    }
    await corporateDocumentService.issueDeliveryChallan(order.userId, {
        orderId: order.id,
        vendorPurchaseOrderId: vendorPo.id,
        eWayBillNumber: "TEST-EWB-20X20",
    });
    if (
        !order.status ||
        ![
            "ready_for_dispatch",
            "dispatched",
            "delivered",
            "completed",
        ].includes(order.status)
    ) {
        await corporateOrderService.updateStatus({
            corporateOrderId: order.id,
            toStatus: "ready_for_dispatch",
            changedByUserId: order.userId,
            note: "Automated document-chain verification; no notification sent.",
        });
    }
    const chain = await corporateDocumentService.getOrderDocumentChain(
        order.id
    );
    console.log(
        JSON.stringify(
            {
                orderId: order.id,
                payment: {
                    totalPaise: order.totalPaise,
                    paidPaise: order.advancePaidPaise,
                    balancePaise: order.balanceDuePaise,
                },
                documents: {
                    proforma: chain.proformaInvoice?.invoiceNumber,
                    customerPo: chain.incomingPurchaseOrder?.poNumber,
                    receiptVoucher: chain.receiptVoucher?.voucherNumber,
                    renivetPo: chain.vendorPurchaseOrder?.poNumber,
                    brandTaxInvoice: chain.brandTaxInvoice?.invoiceNumber,
                    customerTaxInvoice: chain.customerTaxInvoice?.invoiceNumber,
                    deliveryChallan: chain.deliveryChallan?.challanNumber,
                },
                brandInvoiceValidation: chain.brandTaxInvoice?.validationStatus,
            },
            null,
            2
        )
    );
    console.log("No notification service was called.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
