import {
    CorporateCommercialDocumentTemplate,
    type CorporateCommercialDocumentData,
} from "@/components/pdf/corporate-commercial-document-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    brandConfidentials,
    corporatePurchaseOrders,
    corporateVendorPurchaseOrders,
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

export const runtime = "nodejs";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { userId } = await auth();
    if (!userId)
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const user = await userCache.get(userId);
    const permissions = user
        ? getUserPermissions(user.roles).sitePermissions
        : 0;
    if (!hasPermission(permissions, [BitFieldSitePermission.VIEW_ORDERS])) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const order = await db.query.corporateOrders.findFirst({
        where: (table, { eq }) => eq(table.id, id),
        with: { brand: true, quote: { with: { profile: true } } },
    });
    if (!order?.brand)
        return NextResponse.json(
            { message: "Corporate order or supplier brand not found" },
            { status: 404 }
        );

    const vendorPo = await db.query.corporateVendorPurchaseOrders.findFirst({
        where: eq(corporateVendorPurchaseOrders.orderId, order.id),
        orderBy: [desc(corporateVendorPurchaseOrders.createdAt)],
    });
    if (!vendorPo || vendorPo.status === "cancelled") {
        return NextResponse.json(
            { message: "Renivet purchase order has not been issued" },
            { status: 404 }
        );
    }

    const [settings, brandDetails, customerPo, product] = await Promise.all([
        getCorporateDocumentSettings(),
        db.query.brandConfidentials.findFirst({
            where: eq(brandConfidentials.id, order.brand.id),
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
    ]);

    const data: CorporateCommercialDocumentData = {
        title: "Purchase Order",
        subtitle:
            "Purchase order issued by Renivet to the fulfilment brand at the agreed buy price.",
        documentNumber: vendorPo.poNumber,
        documentDate: vendorPo.issueDate,
        validUntil: vendorPo.expectedDeliveryDate,
        fromLabel: "Buyer",
        toLabel: "Supplier",
        from: {
            name: settings.legalName,
            address: corporatePartyAddress(settings) || "Not provided",
            gstin: settings.gstin,
            email: settings.email,
            phone: settings.phone,
        },
        to: {
            name: order.brand.name,
            address:
                corporatePartyAddress(brandDetails ?? {}) || "Not provided",
            gstin: brandDetails?.gstin,
            email: order.brand.email,
            phone: order.brand.phone,
        },
        references: [
            { label: "Corporate order", value: order.publicOrderId },
            { label: "Customer PO", value: customerPo?.poNumber },
            {
                label: "Delivery mode",
                value:
                    vendorPo.deliveryMode === "direct_to_customer"
                        ? "Direct to customer"
                        : "Renivet warehouse",
            },
            { label: "Deliver to", value: vendorPo.deliveryAddress },
            {
                label: "Expected delivery",
                value: vendorPo.expectedDeliveryDate
                    ? new Date(
                          vendorPo.expectedDeliveryDate
                      ).toLocaleDateString("en-IN")
                    : null,
            },
        ],
        item: {
            description: product?.title ?? "Corporate merchandise",
            detail: "Manufacture and fulfil as per the approved corporate specification and QC requirements.",
            sku: product?.sku ?? product?.nativeSku,
            hsn: product?.hsCode,
            quantity: vendorPo.quantity,
            unitRatePaise: vendorPo.unitBuyPricePaise,
            amountPaise: vendorPo.taxableValuePaise,
        },
        totals: {
            taxableValuePaise: vendorPo.taxableValuePaise,
            cgstPaise: vendorPo.cgstPaise,
            sgstPaise: vendorPo.sgstPaise,
            igstPaise: vendorPo.igstPaise,
            totalAmountPaise: vendorPo.totalAmountPaise,
        },
        notes: [
            vendorPo.paymentTerms,
            vendorPo.deliveryInstructions ||
                "Brand tax invoice must name Renivet as the recipient and match this purchase order.",
        ],
        signatoryName: settings.authorizedSignatoryName,
        declarationCompanyName: settings.legalName,
    };

    const stream = await renderToStream(
        <CorporateCommercialDocumentTemplate data={data} />
    );
    const chunks: Buffer[] = [];
    for await (const chunk of stream)
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const safeNumber = vendorPo.poNumber.replace(/[^a-z0-9_-]+/gi, "_");
    return new NextResponse(Buffer.concat(chunks), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="renivet-purchase-order_${safeNumber}.pdf"`,
            "Cache-Control": "private, no-store",
        },
    });
}
