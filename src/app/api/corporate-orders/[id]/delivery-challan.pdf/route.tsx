import {
    CorporateCommercialDocumentTemplate,
    type CorporateCommercialDocumentData,
} from "@/components/pdf/corporate-commercial-document-template";
import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    corporateDeliveryChallans,
    corporateVendorPurchaseOrders,
    products,
} from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { getCorporateDocumentSettings } from "@/lib/services/corporate-documents";
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
    const { id } = await params;
    const order = await db.query.corporateOrders.findFirst({
        where: (table, { eq }) => eq(table.id, id),
        with: { quote: true },
    });
    if (!order)
        return NextResponse.json(
            { message: "Corporate order not found" },
            { status: 404 }
        );

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

    const challan = await db.query.corporateDeliveryChallans.findFirst({
        where: eq(corporateDeliveryChallans.orderId, order.id),
        orderBy: [desc(corporateDeliveryChallans.createdAt)],
    });
    if (!challan || challan.status === "cancelled") {
        return NextResponse.json(
            { message: "Delivery challan has not been issued" },
            { status: 404 }
        );
    }

    const [settings, vendorPo, product] = await Promise.all([
        getCorporateDocumentSettings(),
        db.query.corporateVendorPurchaseOrders.findFirst({
            where: eq(corporateVendorPurchaseOrders.orderId, order.id),
            orderBy: [desc(corporateVendorPurchaseOrders.createdAt)],
        }),
        order.quote?.productId
            ? db.query.products.findFirst({
                  where: eq(products.id, order.quote.productId),
              })
            : Promise.resolve(null),
    ]);

    const data: CorporateCommercialDocumentData = {
        title: "Delivery Challan",
        subtitle:
            "Goods movement document for direct fulfilment on behalf of Renivet. Not a tax invoice.",
        documentNumber: challan.challanNumber,
        documentDate: challan.challanDate,
        fromLabel: "Consignor / shipper",
        toLabel: "Consignee",
        from: {
            name: challan.consignorName,
            address: challan.consignorAddress,
        },
        to: {
            name: challan.consigneeName,
            address: challan.consigneeAddress,
            gstin: order.gstNumber,
        },
        references: [
            { label: "Corporate order", value: order.publicOrderId },
            { label: "Renivet PO", value: vendorPo?.poNumber },
            { label: "On behalf of", value: challan.onBehalfOf },
            { label: "Reason for movement", value: challan.reasonForMovement },
            { label: "E-way bill", value: challan.eWayBillNumber },
        ],
        item: {
            description: product?.title ?? "Corporate merchandise",
            detail: "Goods supplied against the referenced Renivet corporate order.",
            sku: product?.sku ?? product?.nativeSku,
            hsn: product?.hsCode,
            quantity: order.quantity,
        },
        totals: null,
        notes: [
            "This challan records movement of goods only and does not replace the Renivet tax invoice.",
            "The consignee should verify package count and visible condition at receipt.",
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
    const safeNumber = challan.challanNumber.replace(/[^a-z0-9_-]+/gi, "_");
    return new NextResponse(Buffer.concat(chunks), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="delivery-challan_${safeNumber}.pdf"`,
            "Cache-Control": "private, no-store",
        },
    });
}
