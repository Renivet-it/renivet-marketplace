export function resolveGstExportInvoiceNumber(input: {
    invoiceNumber: string | null | undefined;
    orderId: string;
}): string {
    const invoiceNumber = input.invoiceNumber?.trim();
    if (!invoiceNumber) {
        throw new Error(
            `Authoritative invoice number is missing for order ${input.orderId}`
        );
    }

    return invoiceNumber;
}

export function resolveGstExportReference(orderId: string) {
    return {
        label: "Order reference" as const,
        value: orderId,
    };
}
