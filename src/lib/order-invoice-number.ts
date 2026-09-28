const INVOICE_TOKEN_LENGTH = 24;

export function createAuthoritativeInvoiceNumber(options?: {
    randomToken?: () => string;
}): string {
    const randomToken =
        options?.randomToken ??
        (() => crypto.randomUUID().replaceAll("-", "").slice(0, INVOICE_TOKEN_LENGTH));
    const token = randomToken();

    if (!/^[A-Za-z0-9]+$/.test(token) || token.length < INVOICE_TOKEN_LENGTH) {
        throw new Error(
            `Invoice token must contain at least ${INVOICE_TOKEN_LENGTH} safe characters`
        );
    }

    const normalized = token.slice(0, INVOICE_TOKEN_LENGTH).toUpperCase();
    const groups = normalized.match(/.{4}/g);
    if (!groups || groups.length !== 6) {
        throw new Error("Invoice token format is invalid");
    }

    return `INV-${groups.join("-")}`;
}
