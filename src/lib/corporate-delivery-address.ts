export type CorporateDeliveryAddressFields = {
    deliveryCountry: string;
    deliveryState?: string;
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
    ]
        .map(readString)
        .filter(Boolean);

    return {
        deliveryCountry: readString(record.country),
        deliveryState: readString(record.state),
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
        deliveryState: value.deliveryState?.trim() || "",
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
        value.deliveryState?.trim(),
        value.deliveryPincode?.trim(),
        value.deliveryCountry?.trim(),
    ]
        .filter(Boolean)
        .join(", ");
}

export function isCorporateDeliveryAddressValid(value?: {
    deliveryAddress?: string | null;
    deliveryCity?: string | null;
    deliveryPincode?: string | null;
    deliveryCountry?: string | null;
    contactPersonName?: string | null;
    mobileNumber?: string | null;
} | null): boolean {
    if (!value) return false;

    const pin = (value.deliveryPincode ?? "").trim();
    const address = (value.deliveryAddress ?? "").trim();
    const city = (value.deliveryCity ?? "").trim();
    const phone = (value.mobileNumber ?? "").trim();
    const name = (value.contactPersonName ?? "").trim();

    const isPinValid = /^\d{6}$/.test(pin) && pin !== "000000";
    const isAddressValid =
        address.length >= 5 &&
        address.toLowerCase() !== "address not provided" &&
        address.toLowerCase() !== "unknown";
    const isCityValid =
        city.length >= 2 && city.toLowerCase() !== "unknown";
    const isPhoneValid = phone.length >= 10;
    const isNameValid = name.length >= 2;

    return Boolean(
        isPinValid && isAddressValid && isCityValid && isPhoneValid && isNameValid
    );
}

