import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import { corporatePurchaseOrders } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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
    const purchaseOrder = await db.query.corporatePurchaseOrders.findFirst({
        where: eq(corporatePurchaseOrders.corporateOrderId, order.id),
        orderBy: [desc(corporatePurchaseOrders.createdAt)],
    });
    if (!purchaseOrder?.uploadedFileUrl)
        return NextResponse.json(
            { message: "Purchase order file not found" },
            { status: 404 }
        );
    return NextResponse.redirect(purchaseOrder.uploadedFileUrl, 307);
}
