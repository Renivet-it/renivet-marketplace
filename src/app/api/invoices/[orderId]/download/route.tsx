import { InvoiceTemplate } from "@/components/pdf/invoice-template";
import { db } from "@/lib/db";
import { hsnMaster, orders } from "@/lib/db/schema";
import { verifyInvoiceDownloadToken } from "@/lib/invoice-download";
import { validateHighValueB2cInvoice } from "@/lib/invoice-validation";
import { renderToStream } from "@react-pdf/renderer";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET(
    request: Request,
    context: { params: Promise<{ orderId: string }> }
) {
    try {
        const { orderId } = await context.params;
        const token = new URL(request.url).searchParams.get("token") ?? "";
        const copyTypeParam = new URL(request.url).searchParams.get("copyType");
        const copyType =
            copyTypeParam === "duplicate" || copyTypeParam === "triplicate"
                ? copyTypeParam
                : "original";
        const storedOrder = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                user: true,
                address: true,
                items: {
                    with: {
                        variant: true,
                        product: {
                            with: {
                                brand: {
                                    with: {
                                        confidential: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (
            !storedOrder?.invoiceNumber ||
            !token ||
            !verifyInvoiceDownloadToken(
                storedOrder.id,
                storedOrder.invoiceNumber,
                token
            )
        ) {
            return NextResponse.json(
                { message: "Invalid invoice download link" },
                { status: 403 }
            );
        }

        const brand = storedOrder.items[0]?.product?.brand;
        if (!brand) {
            return NextResponse.json(
                { message: "Invoice supplier is unavailable" },
                { status: 422 }
            );
        }

        const address = storedOrder.address;
        const customerName =
            `${storedOrder.user.firstName} ${storedOrder.user.lastName}`.trim();
        const customerAddress = [
            address.street,
            address.city,
            address.state,
            address.zip,
        ]
            .filter(Boolean)
            .join(", ");
        const complianceError = validateHighValueB2cInvoice({
            totalAmountPaise: storedOrder.totalAmount,
            customerGstin: storedOrder.customerGstin,
            copyType,
            customerName,
            address: customerAddress,
            state: address.state,
        });
        if (complianceError) {
            return NextResponse.json(
                { message: complianceError },
                { status: 422 }
            );
        }

        const hsnCodes = storedOrder.items
            .map((item) => item.product?.hsCode ?? item.variant?.hsCode ?? "")
            .filter(Boolean);
        const hsnRows = hsnCodes.length
            ? await db.query.hsnMaster.findMany({
                  where: inArray(hsnMaster.hsnCode, hsnCodes),
                  columns: { hsnCode: true, gstRateBps: true },
              })
            : [];
        const gstRateByHsn = new Map(
            hsnRows.map((row) => [row.hsnCode, row.gstRateBps])
        );
        const qrCodeDataUrl = await QRCode.toDataURL(request.url, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 180,
        });
        const invoiceOrder = {
            id: storedOrder.id,
            receiptId: storedOrder.receiptId,
            invoiceNumber: storedOrder.invoiceNumber,
            paymentMethod: storedOrder.paymentMethod,
            paymentId: storedOrder.paymentId,
            date:
                storedOrder.invoiceIssuedAt ??
                storedOrder.createdAt ??
                new Date(),
            customerName,
            address: customerAddress,
            state: address.state,
            orderDate: storedOrder.createdAt,
            customerGstin: storedOrder.customerGstin,
            amount: storedOrder.totalAmount,
            deliveryAmount: storedOrder.deliveryAmount,
            discountAmount: storedOrder.discountAmount,
            couponCode: storedOrder.couponCode,
            qrCodeDataUrl,
            items: storedOrder.items.map((item) => {
                const hsnCode =
                    item.product?.hsCode ?? item.variant?.hsCode ?? "";
                return {
                    quantity: item.quantity,
                    product: {
                        title: item.product?.title,
                        price: item.product?.price ?? 0,
                        compareAtPrice: item.product?.compareAtPrice,
                        hsCode: item.product?.hsCode,
                        sku: item.product?.sku,
                        nativeSku: item.product?.nativeSku,
                    },
                    variant: item.variant
                        ? {
                              price: item.variant.price ?? undefined,
                              compareAtPrice: item.variant.compareAtPrice,
                              hsCode: item.variant.hsCode,
                              sku: item.variant.sku,
                              nativeSku: item.variant.nativeSku,
                          }
                        : undefined,
                    gstRateBps: gstRateByHsn.get(hsnCode) ?? 0,
                };
            }),
            brand,
        };
        const stream = await renderToStream(
            <InvoiceTemplate order={invoiceOrder} />
        );
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) chunks.push(chunk);

        return new NextResponse(Buffer.concat(chunks), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="invoice_${storedOrder.invoiceNumber.replace(/[^\w-]+/g, "_")}.pdf"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Invoice download error:", error);
        return NextResponse.json(
            { message: "Failed to download invoice" },
            { status: 500 }
        );
    }
}
