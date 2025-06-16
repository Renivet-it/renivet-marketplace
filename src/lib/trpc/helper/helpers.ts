export function buildBrandShippingDetails(
    brand: any,
    confidential: any
): {
    shipping_customer_name: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_country: string;
    shipping_pincode: string;
    shipping_phone: string;
    shipping_email: string;
} {
    const useWarehouse = confidential.isSameAsWarehouseAddress;

    return {
        shipping_customer_name: brand.name,
        shipping_address: useWarehouse
            ? `${confidential.warehouseAddressLine1 ?? ""} ${confidential.warehouseAddressLine2 ?? ""}`.trim()
            : `${confidential.addressLine1 ?? ""} ${confidential.addressLine2 ?? ""}`.trim(),
        shipping_city: useWarehouse
            ? confidential.warehouseCity
            : confidential.city,
        shipping_state: useWarehouse
            ? confidential.warehouseState
            : confidential.state,
        shipping_country: useWarehouse
            ? confidential.warehouseCountry
            : confidential.country,
        shipping_pincode: useWarehouse
            ? confidential.warehousePostalCode
            : confidential.postalCode,
        shipping_phone: confidential.authorizedSignatoryPhone,
        shipping_email: confidential.authorizedSignatoryEmail,
    };
}

const isNonEmptyObject = (obj: any) =>
    obj && typeof obj === "object" && Object.keys(obj).length > 0;

export function generateOrderItemDetails(orderItem: any, totalAmount: number) {
    const { product, variant, variantId, quantity } = orderItem;

    const name = product.title;
    const units = quantity;
    const sku =
        variantId && isNonEmptyObject(variant)
            ? variant.sku
            : product.nativeSku;

    const selling_price = totalAmount;

    return [
        {
            name,
            sku,
            units,
            selling_price,
        },
    ];
}

export function generateShippingDimensions(orderItem: any) {
    const { product, variant, variantId } = orderItem;

    // Choose source based on variant existence
    const source = variantId && isNonEmptyObject(variant) ? variant : product;

    // Helper to default to 1 if null/undefined/zero
    const safeValue = (val: number | null | undefined): number =>
        val && val > 0 ? val : 1;

    return {
        weight: safeValue(source.weight),
        length: safeValue(source.length),
        width: safeValue(source.width),
        height: safeValue(source.height),
    };
}
