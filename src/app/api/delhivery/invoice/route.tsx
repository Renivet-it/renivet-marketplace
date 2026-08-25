import { InvoiceTemplate } from "@/components/pdf/invoice-template";
import { requireShipmentLogisticsAccess } from "@/lib/auth/logistics-access";
import { db } from "@/lib/db";
import { brands, hsnMaster, orders } from "@/lib/db/schema";
import { createInvoiceDownloadToken } from "@/lib/invoice-download";
import { validateHighValueB2cInvoice } from "@/lib/invoice-validation";
import { renderToStream } from "@react-pdf/renderer";
import { eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

function financialYearCode(date: Date) {
    const startYear =
        date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
    return `${String(startYear).slice(-2)}${String(startYear + 1).slice(-2)}`;
}

function defaultBrandInvoiceCode(brandName: string, brandId: string) {
    const letters = brandName.replace(/[^a-z0-9]/gi, "").toUpperCase();
    return `${letters.slice(0, 3).padEnd(3, "X")}${brandId.replace(/-/g, "").slice(-1).toUpperCase()}`;
}

async function issueInvoiceNumber(params: {
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
        if (!current.length)
            throw new Error("Order not found while issuing invoice number");

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

export async function POST(req: Request) {
    try {
        const { order } = await req.json();
        const denied = await requireShipmentLogisticsAccess(
            typeof order?.id === "string" ? { orderId: order.id } : undefined
        );
        if (denied) return denied;

        const complianceError = validateHighValueB2cInvoice({
            totalAmountPaise: Number(order.totalAmount ?? order.amount ?? 0),
            customerGstin: order.customerGstin,
            customerName: order.customerName,
            address: order.address,
            state: order.state,
        });
        if (complianceError) {
            return NextResponse.json(
                { message: complianceError },
                { status: 422 }
            );
        }
        const storedOrder = await db.query.orders.findFirst({
            where: eq(orders.id, order.id),
            with: {
                items: {
                    with: {
                        product: {
                            with: {
                                brand: {
                                    columns: {
                                        id: true,
                                        name: true,
                                        invoiceCode: true,
                                    },
                                    with: {
                                        confidential: {
                                            columns: {
                                                bankAccountHolderName: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const invoiceBrand = storedOrder?.items[0]?.product?.brand;
        if (!invoiceBrand) {
            return NextResponse.json(
                { message: "Cannot issue an invoice without a supplier brand" },
                { status: 422 }
            );
        }
        const issuedInvoice = await issueInvoiceNumber({
            orderId: order.id,
            brandId: invoiceBrand.id,
            brandName: invoiceBrand.name,
            invoiceCode: invoiceBrand.invoiceCode,
        });
        order.invoiceNumber = issuedInvoice.invoiceNumber;
        order.date = issuedInvoice.issuedAt;
        order.orderDate = order.orderDate ?? storedOrder?.createdAt;
        order.copyType =
            order.copyType === "duplicate" || order.copyType === "triplicate"
                ? order.copyType
                : "original";
        order.brand.confidential = {
            ...order.brand.confidential,
            bankAccountHolderName:
                invoiceBrand.confidential?.bankAccountHolderName,
        };
        const items = Array.isArray(order.items) ? order.items : [];
        const hsnCodes = items
            .map(
                (item: any) =>
                    item.product?.hsCode ?? item.variant?.hsCode ?? item.hsCode
            )
            .filter(
                (code: unknown): code is string =>
                    typeof code === "string" && Boolean(code.trim())
            );
        const hsnRows = hsnCodes.length
            ? await db.query.hsnMaster.findMany({
                  where: inArray(hsnMaster.hsnCode, hsnCodes),
                  columns: { hsnCode: true, gstRateBps: true },
              })
            : [];
        const gstRateByHsn = new Map(
            hsnRows.map((row) => [row.hsnCode, row.gstRateBps])
        );
        order.items = items.map((item: any) => {
            const hsnCode =
                item.product?.hsCode ??
                item.variant?.hsCode ??
                item.hsCode ??
                "";
            return { ...item, gstRateBps: gstRateByHsn.get(hsnCode) ?? 0 };
        });
        const token = createInvoiceDownloadToken(order.id, order.invoiceNumber);
        const appUrl =
            process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
            new URL(req.url).origin;
        const downloadUrl = `${appUrl}/api/invoices/${encodeURIComponent(order.id)}/download?token=${encodeURIComponent(token)}`;
        order.qrCodeDataUrl = await QRCode.toDataURL(downloadUrl, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 180,
        });

        // Generate PDF Stream
        const stream = await renderToStream(<InvoiceTemplate order={order} />);

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const pdfBuffer = Buffer.concat(chunks);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="invoice_${order.id}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Invoice Error:", error);
        return NextResponse.json(
            { message: "Failed to generate invoice", error: String(error) },
            { status: 500 }
        );
    }
}
