import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { createAuthoritativeInvoiceNumber } from "@/lib/order-invoice-number";
import { sql } from "drizzle-orm";

const MAX_INVOICE_ISSUANCE_ATTEMPTS = 5;

function isUniqueViolation(error: unknown) {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === "23505"
    );
}

export async function ensureOrderInvoiceNumber(params: {
    orderId: string;
    brandId: string;
    brandName: string;
    invoiceCode: string | null;
}) {
    void params.brandId;
    void params.brandName;
    void params.invoiceCode;

    for (let attempt = 1; attempt <= MAX_INVOICE_ISSUANCE_ATTEMPTS; attempt += 1) {
        const issuedAt = new Date();

        try {
            return await db.transaction(async (tx) => {
                const current = await tx.execute<{
                    invoice_number: string | null;
                    invoice_issued_at: Date | null;
                }>(sql`
                    SELECT invoice_number, invoice_issued_at
                    FROM orders
                    WHERE id = ${params.orderId}
                    FOR UPDATE
                `);
                const existing = current[0]?.invoice_number;
                if (existing) {
                    return {
                        invoiceNumber: existing,
                        issuedAt: current[0]?.invoice_issued_at ?? issuedAt,
                    };
                }
                if (!current.length) {
                    throw new Error("Order not found while issuing invoice number");
                }

                const invoiceNumber = createAuthoritativeInvoiceNumber();
                await tx
                    .update(orders)
                    .set({ invoiceNumber, invoiceIssuedAt: issuedAt })
                    .where(sql`${orders.id} = ${params.orderId}`);

                return { invoiceNumber, issuedAt };
            });
        } catch (error) {
            if (!isUniqueViolation(error) || attempt === MAX_INVOICE_ISSUANCE_ATTEMPTS) {
                throw error;
            }
        }
    }

    throw new Error("Invoice number issuance exhausted its retry budget");
}
