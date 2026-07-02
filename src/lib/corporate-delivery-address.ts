export type CorporateDeliveryAddressFields = {
    deliveryCountry: string;
    deliveryCity: string;
    deliveryPincode: string;
    deliveryAddress: string;
};

function readString(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

export function extractCorporateDeliveryAddress(
    value: unknown
): Partial<CorporateDeliveryAddressFields> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }

    const record = value as Record<string, unknown>;
    const addressParts = [
        record.addressLine1,
        record.addressLine2,
        record.street,
        record.area,
        record.landmark,
        record.state,
    ]
        .map(readString)
        .filter(Boolean);

    return {
        deliveryCountry: readString(record.country),
        deliveryCity: readString(record.city),
        deliveryPincode: readString(
            record.postalCode ?? record.zip ?? record.pincode
        ),
        deliveryAddress: addressParts.join(", "),
    };
}

export function fillCorporateDeliveryAddressDefaults(
    value: Partial<CorporateDeliveryAddressFields>
): CorporateDeliveryAddressFields {
    return {
        deliveryCountry: value.deliveryCountry?.trim() || "India",
        deliveryCity: value.deliveryCity?.trim() || "Unknown",
        deliveryPincode: value.deliveryPincode?.trim() || "000000",
        deliveryAddress:
            value.deliveryAddress?.trim() || "Address not provided",
    };
}

export function formatCorporateDeliveryAddress(
    value: Partial<CorporateDeliveryAddressFields>
) {
    return [
        value.deliveryAddress?.trim(),
        value.deliveryCity?.trim(),
        value.deliveryPincode?.trim(),
        value.deliveryCountry?.trim(),
    ]
        .filter(Boolean)
        .join(", ");
}
