export type InvoicePersistenceResult = {
    invoiceNumber: string;
    issuedAt?: Date;
};

type InvoiceRetryOptions = {
    issue: () => Promise<InvoicePersistenceResult>;
    maxAttempts?: number;
    delayMs?: number;
    sleep?: (delayMs: number) => Promise<void>;
    onFailure?: (error: Error, attempts: number) => Promise<void>;
};

const defaultSleep = (delayMs: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, delayMs));

export async function ensureInvoiceWithRetry({
    issue,
    maxAttempts = 3,
    delayMs = 250,
    sleep = defaultSleep,
    onFailure,
}: InvoiceRetryOptions): Promise<InvoicePersistenceResult> {
    let lastError: Error = new Error("Invoice persistence failed");

    for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt += 1) {
        try {
            return await issue();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < Math.max(1, maxAttempts)) {
                await sleep(delayMs * attempt);
            }
        }
    }

    await onFailure?.(lastError, Math.max(1, maxAttempts));
    throw lastError;
}
