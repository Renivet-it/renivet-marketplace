import { createHmac, timingSafeEqual } from "crypto";

function getSigningSecret() {
    const secret =
        process.env.INVOICE_DOWNLOAD_SECRET ?? process.env.CLERK_SECRET_KEY;

    if (!secret) {
        throw new Error(
            "INVOICE_DOWNLOAD_SECRET must be configured to create invoice download links"
        );
    }

    return secret;
}

export function createInvoiceDownloadToken(
    orderId: string,
    invoiceNumber: string
) {
    return createHmac("sha256", getSigningSecret())
        .update(`${orderId}:${invoiceNumber}`)
        .digest("base64url");
}

export function verifyInvoiceDownloadToken(
    orderId: string,
    invoiceNumber: string,
    token: string
) {
    const expected = createInvoiceDownloadToken(orderId, invoiceNumber);
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(token);

    return (
        expectedBuffer.length === receivedBuffer.length &&
        timingSafeEqual(expectedBuffer, receivedBuffer)
    );
}
