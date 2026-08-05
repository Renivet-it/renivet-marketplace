import {
    CorporateTaxInvoiceTemplate,
    type CorporateTaxInvoiceData,
} from "@/components/pdf/corporate-tax-invoice-template";
import { BitFieldSitePermission } from "@/config/permissions";
import {
    corporateDocumentNumber,
    RENIVET_CORPORATE_SELLER_NAME,
} from "@/lib/corporate-documents";
import { db } from "@/lib/db";
import {
    corporatePurchaseOrders,
    corporateReceiptVouchers,
    corporateTaxInvoices,
    products,
} from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import {
    corporatePartyAddress,
    getCorporateDocumentSettings,
} from "@/lib/services/corporate-documents";
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
                shipment: true,
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

        const [invoice, purchaseOrder, product, settings] = await Promise.all([
            db.query.corporateTaxInvoices.findFirst({
                where: eq(corporateTaxInvoices.orderId, order.id),
                orderBy: [desc(corporateTaxInvoices.createdAt)],
            }),
            db.query.corporatePurchaseOrders.findFirst({
                where: eq(corporatePurchaseOrders.corporateOrderId, order.id),
                orderBy: [desc(corporatePurchaseOrders.createdAt)],
            }),
            order.quote?.productId
                ? db.query.products.findFirst({
                      where: eq(products.id, order.quote.productId),
                  })
                : Promise.resolve(null),
            getCorporateDocumentSettings(),
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
        const receiptVoucher = invoice.receiptVoucherId
            ? await db.query.corporateReceiptVouchers.findFirst({
                  where: eq(
                      corporateReceiptVouchers.id,
                      invoice.receiptVoucherId
                  ),
              })
            : null;
        const sellerAddress = corporatePartyAddress(settings);
        const downloadUrl = `${new URL(request.url).origin}/api/corporate-orders/${order.id}/invoice.pdf`;
        const qrCodeDataUrl = await QRCode.toDataURL(downloadUrl, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 180,
        });

        const data: CorporateTaxInvoiceData = {
            invoice: {
                ...invoice,
                receiptVoucherNumber: receiptVoucher?.voucherNumber ?? null,
            },
            order: {
                ...order,
                eWayBillNumber: text(
                    (
                        order.shipment?.rawPayload as Record<
                            string,
                            unknown
                        > | null
                    )?.eWayBillNumber ??
                        (
                            order.shipment?.rawPayload as Record<
                                string,
                                unknown
                            > | null
                        )?.ewayBillNumber
                ),
                paymentMethod: "prepaid",
                paymentId:
                    order.paymentReference ??
                    order.razorpayPaymentId ??
                    "Not available",
            },
            seller: {
                name: RENIVET_CORPORATE_SELLER_NAME,
                logoUrl:
                    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw",
                email: settings.email,
                phone: settings.phone,
                gstin: settings.gstin,
                cin: settings.cin,
                address: sellerAddress || "Not provided",
                addressLine1: settings.addressLine1,
                addressLine2: settings.addressLine2,
                city: settings.city,
                state: settings.state,
                postalCode: settings.postalCode,
                country: settings.country,
                bankName: settings.bankName,
                bankAccountHolderName: settings.bankAccountName,
                bankAccountNumber: settings.bankAccountNumber,
                bankAccountType: settings.bankAccountType,
                bankIfscCode: settings.bankIfscCode,
                bankBranch: settings.bankBranch,
                authorizedSignatoryName: settings.authorizedSignatoryName,
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
        const displayedInvoiceNumber = invoice.invoiceNumber.startsWith("CINV/")
            ? invoice.invoiceNumber
            : corporateDocumentNumber(
                  "CINV",
                  order.sequenceNo,
                  invoice.invoiceDate ?? new Date()
              );
        const safeInvoiceNumber = displayedInvoiceNumber.replace(
            /[^a-z0-9_-]+/gi,
            "_"
        );
        const paymentStage =
            order.balanceDuePaise > 0 ? "partial-payment" : "paid-in-full";

        return new NextResponse(Buffer.concat(chunks), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="corporate-${paymentStage}-invoice_${safeInvoiceNumber}.pdf"`,
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
