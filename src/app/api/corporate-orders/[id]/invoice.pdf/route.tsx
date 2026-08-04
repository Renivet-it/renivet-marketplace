import {
    CorporateTaxInvoiceTemplate,
    type CorporateTaxInvoiceData,
} from "@/components/pdf/corporate-tax-invoice-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    brandConfidentials,
    corporatePurchaseOrders,
    corporateTaxInvoices,
    products,
} from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { renderToStream } from "@react-pdf/renderer";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

function text(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function formatAddress(value: unknown) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    const record = value as Record<string, unknown>;
    return [
        record.addressLine1 ?? record.address,
        record.addressLine2,
        record.street,
        record.area,
        record.landmark,
        record.city,
        record.state,
        record.postalCode ?? record.pincode ?? record.zip,
        record.country,
    ]
        .map(text)
        .filter(Boolean)
        .join(", ");
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const order = await db.query.corporateOrders.findFirst({
            where: (table, { eq }) => eq(table.id, id),
            with: {
                brand: true,
                quote: { with: { profile: true } },
            },
        });
        if (!order) {
            return NextResponse.json(
                { message: "Corporate order not found" },
                { status: 404 }
            );
        }

        const user = await userCache.get(userId);
        const permissions = user
            ? getUserPermissions(user.roles).sitePermissions
            : 0;
        const canViewAdmin = hasPermission(permissions, [
            BitFieldSitePermission.VIEW_ORDERS,
        ]);
        if (!canViewAdmin && order.userId !== userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const [invoice, purchaseOrder, product, confidential] =
            await Promise.all([
                db.query.corporateTaxInvoices.findFirst({
                    where: eq(corporateTaxInvoices.orderId, order.id),
                    orderBy: [desc(corporateTaxInvoices.createdAt)],
                }),
                db.query.corporatePurchaseOrders.findFirst({
                    where: eq(
                        corporatePurchaseOrders.corporateOrderId,
                        order.id
                    ),
                    orderBy: [desc(corporatePurchaseOrders.createdAt)],
                }),
                order.quote?.productId
                    ? db.query.products.findFirst({
                          where: eq(products.id, order.quote.productId),
                      })
                    : Promise.resolve(null),
                order.brandId
                    ? db.query.brandConfidentials.findFirst({
                          where: eq(brandConfidentials.id, order.brandId),
                      })
                    : Promise.resolve(null),
            ]);

        if (!invoice || invoice.status !== "issued") {
            return NextResponse.json(
                {
                    message:
                        "Tax invoice has not been issued for this corporate order",
                },
                { status: 404 }
            );
        }
        if (!order.brand) {
            return NextResponse.json(
                {
                    message:
                        "A seller brand must be assigned before downloading the invoice",
                },
                { status: 422 }
            );
        }

        const profile = order.quote?.profile;
        const profileBillingAddress =
            profile?.billingAddress &&
            typeof profile.billingAddress === "object" &&
            !Array.isArray(profile.billingAddress)
                ? (profile.billingAddress as Record<string, unknown>)
                : {};
        const fallbackDeliveryAddress = [
            order.deliveryAddress,
            order.deliveryCity,
            order.deliveryPincode,
            order.deliveryCountry,
        ]
            .filter(Boolean)
            .join(", ");
        const sellerAddress = [
            confidential?.addressLine1,
            confidential?.addressLine2,
            confidential?.city,
            confidential?.state,
            confidential?.postalCode,
            confidential?.country,
        ]
            .filter(Boolean)
            .join(", ");
        const downloadUrl = `${new URL(request.url).origin}/api/corporate-orders/${order.id}/invoice.pdf`;
        const qrCodeDataUrl = await QRCode.toDataURL(downloadUrl, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 180,
        });

        const data: CorporateTaxInvoiceData = {
            invoice,
            order: {
                ...order,
                paymentMethod: "prepaid",
                paymentId:
                    order.paymentReference ??
                    order.razorpayPaymentId ??
                    "Not available",
            },
            seller: {
                name: order.brand.name,
                logoUrl: order.brand.logoUrl,
                email: order.brand.email,
                phone: order.brand.phone,
                gstin: confidential?.gstin,
                address: sellerAddress || "Not provided",
                addressLine1: confidential?.addressLine1,
                addressLine2: confidential?.addressLine2,
                city: confidential?.city,
                state: confidential?.state,
                postalCode: confidential?.postalCode,
                country: confidential?.country,
                bankName: confidential?.bankName,
                bankAccountHolderName: confidential?.bankAccountHolderName,
                bankAccountNumber: confidential?.bankAccountNumber,
                bankAccountType: confidential?.bankAccountType,
                bankIfscCode: confidential?.bankIfscCode,
                authorizedSignatoryName: confidential?.authorizedSignatoryName,
            },
            buyer: {
                companyName: profile?.companyName ?? order.companyName,
                gstNumber: profile?.gstNumber ?? order.gstNumber,
                billingAddress:
                    formatAddress(profile?.billingAddress) ||
                    fallbackDeliveryAddress,
                placeOfSupply: text(profileBillingAddress.state) || undefined,
            },
            purchaseOrder: purchaseOrder
                ? {
                      poNumber: purchaseOrder.poNumber,
                      poDate: purchaseOrder.poDate,
                  }
                : null,
            product: product
                ? {
                      title: product.title,
                      sku: product.sku ?? product.nativeSku,
                      hsn: product.hsCode,
                  }
                : null,
            qrCodeDataUrl,
        };

        const stream = await renderToStream(
            <CorporateTaxInvoiceTemplate data={data} />
        );
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const safeInvoiceNumber = invoice.invoiceNumber.replace(
            /[^a-z0-9_-]+/gi,
            "_"
        );

        return new NextResponse(Buffer.concat(chunks), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="corporate-tax-invoice_${safeInvoiceNumber}.pdf"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Corporate tax invoice download error:", error);
        return NextResponse.json(
            { message: "Failed to generate corporate tax invoice" },
            { status: 500 }
        );
    }
}
