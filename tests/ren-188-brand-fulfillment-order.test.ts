import { describe, expect, test } from "bun:test";
import { buildBrandFulfillmentOrderSections } from "../src/app/api/corporate-orders/[id]/vendor-po-data";

describe("buildBrandFulfillmentOrderSections", () => {
    test("maps stored supplier, customer, delivery, production, QC, and shipment data", () => {
        const sections = buildBrandFulfillmentOrderSections({
            brand: {
                name: "Loom House",
                address: "Brand address",
                gstin: "BRANDGST",
                email: "brand@example.com",
                phone: "9999999999",
            },
            order: {
                publicOrderId: "CORP-001",
                companyName: "Acme Pvt Ltd",
                contactPersonName: "Asha",
                gstNumber: "CUSTOMERGST",
                mobileNumber: "8888888888",
                deliveryCity: "Pune",
                deliveryState: "Maharashtra",
                deliveryPincode: "411001",
                deliveryAddress: "Customer address",
                productConfigSnapshot: {
                    productType: { name: "Cotton Shirt" },
                    gsmOption: { gsm: "180" },
                    fabricComposition: { composition: "Cotton" },
                },
                sizeBreakdown: { M: 4, L: 6 },
            },
            fulfillmentOrder: {
                deliveryMode: "direct_to_customer",
                deliveryAddress: "FO delivery address",
                expectedDeliveryDate: "2026-09-20",
                deliveryInstructions: "Pack by size and attach the slip.",
                customizations: [
                    {
                        type: "Embroidery",
                        status: "approved",
                        productionInstruction: "Use supplied artwork",
                    },
                ],
            },
            qc: {
                status: "submitted",
                remarks: "Check thread finish",
                sampleCoveragePercent: 20,
                reviewNotes: "Awaiting final review",
                submittedAt: "2026-09-10",
                reviewedAt: null,
            },
            shipment: {
                courierName: "Delhivery",
                trackingNumber: "TRK-001",
                awbNumber: "AWB-001",
                status: "dispatched",
                dispatchDate: "2026-09-15",
                deliveryDate: null,
            },
        });

        expect(sections.supplier.label).toBe("FULFILLED BY");
        expect(sections.supplier.name).toBe("Loom House");
        expect(sections.customer.label).toBe("CORPORATE CUSTOMER");
        expect(sections.customer.companyName).toBe("Acme Pvt Ltd");
        expect(sections.delivery.label).toBe("DELIVER TO");
        expect(sections.delivery.address).toBe("FO delivery address");
        expect(sections.production.customizations).toEqual([
            "Embroidery (approved)",
        ]);
        expect(sections.production.productionInstructions).toEqual([
            "Embroidery: Use supplied artwork",
        ]);
        expect(sections.qc.status).toBe("submitted");
        expect(sections.shipment.trackingNumber).toBe("TRK-001");
        expect(sections.expectedDeliveryDate).toBe("2026-09-20");
    });

    test("keeps missing optional data unavailable instead of inventing values", () => {
        const sections = buildBrandFulfillmentOrderSections({
            brand: { name: "Loom House" },
            order: {
                publicOrderId: "CORP-002",
                companyName: "Acme Pvt Ltd",
                contactPersonName: "Asha",
                deliveryAddress: "Customer address",
                productConfigSnapshot: {},
                sizeBreakdown: {},
            },
            fulfillmentOrder: {
                deliveryMode: "renivet_warehouse",
                deliveryAddress: "Renivet warehouse",
                expectedDeliveryDate: null,
                deliveryInstructions: null,
                customizations: [],
            },
            qc: null,
            shipment: null,
        });

        expect(sections.expectedDeliveryDate).toBeNull();
        expect(sections.qc.status).toBeNull();
        expect(sections.qc.remarks).toBeNull();
        expect(sections.shipment.trackingNumber).toBeNull();
        expect(sections.production.customizations).toEqual([]);
        expect(sections.production.productionInstructions).toEqual([]);
        expect(sections.production.productType).toBeNull();
    });
});
