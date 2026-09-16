import { db } from "@/lib/db";
import { brands, orders } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

function financialYearCode(date: Date) {
    const startYear =
        date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    return `${String(startYear).slice(-2)}${String(startYear + 1).slice(-2)}`;
}

function defaultBrandInvoiceCode(brandName: string, brandId: string) {
    const letters = brandName.replace(/[^a-z0-9]/gi, "").toUpperCase();
    return `${letters.slice(0, 3).padEnd(3, "X")}${brandId.replace(/-/g, "").slice(-1).toUpperCase()}`;
}

export async function ensureOrderInvoiceNumber(params: {
    orderId: string;
    brandId: string;
    brandName: string;
    invoiceCode: string | null;
}) {
    const issuedAt = new Date();
    const financialYear = financialYearCode(issuedAt);

    return db.transaction(async (tx) => {
        const current = await tx.execute<{
            invoice_number: string | null;
            invoice_issued_at: Date | null;
        }>(sql`
            SELECT invoice_number, invoice_issued_at FROM orders WHERE id = ${params.orderId} FOR UPDATE
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

        const invoiceCode =
            params.invoiceCode ??
            defaultBrandInvoiceCode(params.brandName, params.brandId);
        if (!params.invoiceCode) {
            await tx
                .update(brands)
                .set({ invoiceCode })
                .where(eq(brands.id, params.brandId));
        }

        const sequence = await tx.execute<{ last_sequence: number }>(sql`
            INSERT INTO brand_invoice_sequences (brand_id, financial_year, last_sequence)
            VALUES (${params.brandId}::uuid, ${financialYear}, 1)
            ON CONFLICT (brand_id, financial_year)
            DO UPDATE SET last_sequence = brand_invoice_sequences.last_sequence + 1,
                          updated_at = now()
            RETURNING last_sequence
        `);
        const invoiceNumber = `${invoiceCode}/${financialYear}/${String(sequence[0]?.last_sequence ?? 1).padStart(5, "0")}`;
        await tx
            .update(orders)
            .set({ invoiceNumber, invoiceIssuedAt: issuedAt })
            .where(eq(orders.id, params.orderId));

        return { invoiceNumber, issuedAt };
    });
}
