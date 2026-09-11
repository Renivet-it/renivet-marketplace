type OptionalRecord = Record<string, unknown>;

type PartyInput = {
    name?: string | null;
    address?: string | null;
    gstin?: string | null;
    email?: string | null;
    phone?: string | null;
};

type QcInput =
    | {
          status?: string | null;
          remarks?: string | null;
          sampleCoveragePercent?: number | null;
          reviewNotes?: string | null;
          submittedAt?: string | Date | null;
          reviewedAt?: string | Date | null;
      }
    | null
    | undefined;

type ShipmentInput =
    | {
          courierName?: string | null;
          trackingNumber?: string | null;
          awbNumber?: string | null;
          status?: string | null;
          dispatchDate?: string | Date | null;
          deliveryDate?: string | Date | null;
      }
    | null
    | undefined;

export type BrandFulfillmentOrderSections = {
    supplier: {
        label: "FULFILLED BY";
        name: string | null;
        address: string | null;
        gstin: string | null;
        email: string | null;
        phone: string | null;
    };
    customer: {
        label: "CORPORATE CUSTOMER";
        companyName: string | null;
        contactPersonName: string | null;
        orderId: string | null;
        gstin: string | null;
        phone: string | null;
    };
    delivery: {
        label: "DELIVER TO";
        mode: string | null;
        address: string | null;
        instructions: string | null;
    };
    production: {
        productType: string | null;
        gsm: string | null;
        fabric: string | null;
        customizations: string[];
        productionInstructions: string[];
        sizeBreakdown: Array<{ size: string; quantity: number }>;
    };
    qc: {
        status: string | null;
        remarks: string | null;
        sampleCoveragePercent: number | null;
        reviewNotes: string | null;
        submittedAt: string | Date | null;
        reviewedAt: string | Date | null;
    };
    shipment: {
        courierName: string | null;
        trackingNumber: string | null;
        awbNumber: string | null;
        status: string | null;
        dispatchDate: string | Date | null;
        deliveryDate: string | Date | null;
    };
    expectedDeliveryDate: string | Date | null;
};

type BrandFulfillmentOrderInput = {
    brand: PartyInput;
    order: {
        publicOrderId?: string | null;
        companyName?: string | null;
        contactPersonName?: string | null;
        gstNumber?: string | null;
        mobileNumber?: string | null;
        deliveryAddress?: string | null;
        productConfigSnapshot?: OptionalRecord | null;
        sizeBreakdown?: Record<string, number> | null;
    };
    fulfillmentOrder: {
        deliveryMode?: string | null;
        deliveryAddress?: string | null;
        expectedDeliveryDate?: string | Date | null;
        deliveryInstructions?: string | null;
        customizations?: Array<OptionalRecord> | null;
    };
    qc: QcInput;
    shipment: ShipmentInput;
};

function configText(value: unknown, keys: string[]) {
    if (!value || typeof value !== "object") return null;
    const record = value as OptionalRecord;
    for (const key of keys) {
        const candidate = record[key];
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate.trim();
        }
        if (typeof candidate === "number") return String(candidate);
    }
    return null;
}

function nullableString(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function buildBrandFulfillmentOrderOptionalCopy({
    specsSummary,
    deliveryInstructions,
    fulfillmentAddress,
    orderDeliveryAddress,
}: {
    specsSummary?: string | null;
    deliveryInstructions?: string | null;
    fulfillmentAddress?: string | null;
    orderDeliveryAddress?: string | null;
}) {
    const itemDetail = nullableString(specsSummary);
    const packagingQc = nullableString(deliveryInstructions);
    const deliverToAddress =
        nullableString(fulfillmentAddress) ??
        nullableString(orderDeliveryAddress);

    return {
        itemDetail,
        packagingQc,
        deliverToAddress,
        packagingShippingNote: packagingQc
            ? `Packaging & Shipping: ${packagingQc}`
            : null,
    };
}

function formatCustomization(customization: OptionalRecord) {
    const name = nullableString(
        customization.name ??
            customization.type ??
            customization.customizationType
    );
    if (!name) return null;
    const status = nullableString(customization.status);
    return status ? `${name} (${status})` : name;
}

function formatProductionInstruction(customization: OptionalRecord) {
    const metadata = customization.metadata;
    const instruction = nullableString(
        customization.productionInstruction ??
            (metadata && typeof metadata === "object"
                ? (metadata as OptionalRecord).productionInstruction
                : null)
    );
    if (!instruction) return null;
    const name = nullableString(
        customization.name ??
            customization.type ??
            customization.customizationType
    );
    return name ? `${name}: ${instruction}` : instruction;
}

export function buildBrandFulfillmentOrderSections({
    brand,
    order,
    fulfillmentOrder,
    qc,
    shipment,
}: BrandFulfillmentOrderInput): BrandFulfillmentOrderSections {
    const config = order.productConfigSnapshot ?? {};
    const sizeBreakdown = Object.entries(order.sizeBreakdown ?? {})
        .map(([size, quantity]) => ({ size, quantity: Number(quantity) }))
        .filter(
            ({ size, quantity }) => size.trim() && Number.isFinite(quantity)
        );

    return {
        supplier: {
            label: "FULFILLED BY",
            name: nullableString(brand.name),
            address: nullableString(brand.address),
            gstin: nullableString(brand.gstin),
            email: nullableString(brand.email),
            phone: nullableString(brand.phone),
        },
        customer: {
            label: "CORPORATE CUSTOMER",
            companyName: nullableString(order.companyName),
            contactPersonName: nullableString(order.contactPersonName),
            orderId: nullableString(order.publicOrderId),
            gstin: nullableString(order.gstNumber),
            phone: nullableString(order.mobileNumber),
        },
        delivery: {
            label: "DELIVER TO",
            mode: nullableString(fulfillmentOrder.deliveryMode),
            address:
                nullableString(fulfillmentOrder.deliveryAddress) ??
                nullableString(order.deliveryAddress),
            instructions: nullableString(fulfillmentOrder.deliveryInstructions),
        },
        production: {
            productType: configText(config.productType, [
                "name",
                "title",
                "label",
            ]),
            gsm: configText(config.gsmOption, ["gsm", "name", "label"]),
            fabric: configText(config.fabricComposition, [
                "name",
                "composition",
                "label",
            ]),
            customizations: (fulfillmentOrder.customizations ?? [])
                .map(formatCustomization)
                .filter((value): value is string => value !== null),
            productionInstructions: (fulfillmentOrder.customizations ?? [])
                .map(formatProductionInstruction)
                .filter((value): value is string => value !== null),
            sizeBreakdown,
        },
        qc: {
            status: nullableString(qc?.status),
            remarks: nullableString(qc?.remarks),
            sampleCoveragePercent: qc?.sampleCoveragePercent ?? null,
            reviewNotes: nullableString(qc?.reviewNotes),
            submittedAt: qc?.submittedAt ?? null,
            reviewedAt: qc?.reviewedAt ?? null,
        },
        shipment: {
            courierName: nullableString(shipment?.courierName),
            trackingNumber: nullableString(shipment?.trackingNumber),
            awbNumber: nullableString(shipment?.awbNumber),
            status: nullableString(shipment?.status),
            dispatchDate: shipment?.dispatchDate ?? null,
            deliveryDate: shipment?.deliveryDate ?? null,
        },
        expectedDeliveryDate: fulfillmentOrder.expectedDeliveryDate ?? null,
    };
}
