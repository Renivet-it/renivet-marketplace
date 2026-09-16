import { InvoiceTemplate } from "@/components/pdf/invoice-template";
import { requireShipmentLogisticsAccess } from "@/lib/auth/logistics-access";
import { db } from "@/lib/db";
import { hsnMaster, orders } from "@/lib/db/schema";
import { createInvoiceDownloadToken } from "@/lib/invoice-download";
import { validateHighValueB2cInvoice } from "@/lib/invoice-validation";
import { ensureOrderInvoiceNumber } from "@/lib/order-invoice";
import { renderToStream } from "@react-pdf/renderer";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

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
        const issuedInvoice = await ensureOrderInvoiceNumber({
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
