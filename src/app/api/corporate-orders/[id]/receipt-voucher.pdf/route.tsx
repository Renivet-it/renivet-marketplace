import {
    CorporateReceiptVoucherTemplate,
    type CorporateReceiptVoucherData,
} from "@/components/pdf/corporate-receipt-voucher-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import { corporatePurchaseOrders } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import {
    corporateDocumentService,
    corporatePartyAddress,
    getCorporateDocumentSettings,
} from "@/lib/services/corporate-documents";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { corporatePaymentRequestService } from "@/lib/services/corporate-payment-request";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { renderToStream } from "@react-pdf/renderer";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const renivetLogoUrl =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNqU6nAZGz8F0U3cHoOhlNY6tCDW7PIAe4fpJw";

function address(parts: Array<string | null | undefined>) {
    return parts
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(", ");
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        const { id } = await params;
        const paymentToken = new URL(request.url).searchParams.get("paymentToken");
        const guestAuthorized = paymentToken
            ? await corporatePaymentRequestService.authorizeReceipt(paymentToken, id).catch(() => false)
            : false;
        if (!userId && !guestAuthorized) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const order = await corporateOrderService.getOrderById(id);
        const user = userId ? await userCache.get(userId) : null;
        const permissions = user
            ? getUserPermissions(user.roles).sitePermissions
            : 0;
        const canViewAdmin = hasPermission(permissions, [
            BitFieldSitePermission.VIEW_ORDERS,
        ]);

        if (!guestAuthorized && !canViewAdmin && order.userId !== userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        if (order.advancePaidPaise <= 0) {
            return NextResponse.json(
                { message: "No advance payment has been received" },
                { status: 404 }
            );
        }

        const [settings, purchaseOrder, voucher] = await Promise.all([
            getCorporateDocumentSettings(),
            db.query.corporatePurchaseOrders.findFirst({
                where: eq(corporatePurchaseOrders.corporateOrderId, order.id),
                orderBy: [desc(corporatePurchaseOrders.createdAt)],
            }),
            corporateDocumentService.ensureReceiptVoucher(order.id),
        ]);

        if (!voucher) {
            return NextResponse.json(
                { message: "Receipt voucher has not been issued" },
                { status: 404 }
            );
        }
        const data: CorporateReceiptVoucherData = {
            voucherNumber: voucher.voucherNumber,
            voucherDate: voucher.voucherDate,
            orderNumber: order.publicOrderId,
            poReference: voucher.poReference ?? purchaseOrder?.poNumber,
            amountPaise: voucher.amountPaise,
            paymentMode: voucher.paymentMode,
            paymentReference: voucher.paymentReference,
            seller: {
                name: settings.legalName,
                address: corporatePartyAddress(settings) || "Not provided",
                gstin: settings.gstin,
                bankName: settings.bankName,
                bankAccountName: settings.bankAccountName,
                bankAccountNumber: settings.bankAccountNumber,
                bankIfscCode: settings.bankIfscCode,
                signatoryName: settings.authorizedSignatoryName,
                logoUrl: renivetLogoUrl,
            },
            buyer: {
                name: order.companyName,
                address: address([
                    order.deliveryAddress,
                    order.deliveryCity,
                    order.deliveryPincode,
                    order.deliveryCountry,
                ]),
                gstin: order.gstNumber,
            },
        };

        const stream = await renderToStream(
            <CorporateReceiptVoucherTemplate data={data} />
        );
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const safeVoucherNumber = voucher.voucherNumber.replace(
            /[^a-z0-9_-]+/gi,
            "_"
        );

        return new NextResponse(Buffer.concat(chunks), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="receipt-voucher_${safeVoucherNumber}.pdf"`,
                "Cache-Control": "private, no-store",
            },
        });
    } catch (error) {
        console.error("Corporate receipt voucher download error:", error);
        return NextResponse.json(
            { message: "Failed to generate receipt voucher" },
            { status: 500 }
        );
    }
}
