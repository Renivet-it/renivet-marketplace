type QuoteLifecycle = {
    status: string;
    validUntil: string | null | undefined;
};

export function assertApprovedCorporateQuote(
    quote: QuoteLifecycle,
    now = new Date()
) {
    if (quote.status !== "approved") {
        throw new Error("Corporate quote must be approved before order creation");
    }
    if (quote.validUntil) {
        const expiry = new Date(`${quote.validUntil}T23:59:59.999Z`);
        if (Number.isNaN(expiry.getTime()) || expiry < now) {
            throw new Error("Corporate quote is expired");
        }
    }
    return true;
}

export function assertAllocationMatchesQuantity(
    sizeBreakdown: Record<string, number>,
    quantity: number
) {
    const allocated = Object.values(sizeBreakdown).reduce(
        (sum, value) => sum + value,
        0
    );
    if (allocated !== quantity) {
        throw new Error(
            `Corporate size allocation must equal approved quantity ${quantity}`
        );
    }
    return true;
}
