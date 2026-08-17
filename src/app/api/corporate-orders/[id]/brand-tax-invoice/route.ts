import { BitFieldSitePermission } from "@/config/permissions";
import { db } from "@/lib/db";
import {
    brandMembers,
    corporateBrandTaxInvoices,
    corporateOrders,
} from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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
    const { id } = await params;
    const canViewAllOrders = hasPermission(permissions, [
        BitFieldSitePermission.VIEW_ORDERS,
    ]);
    const order = await db.query.corporateOrders.findFirst({
        where: eq(corporateOrders.id, id),
        columns: { brandId: true },
    });
    const brandMembership =
        !canViewAllOrders && order?.brandId
            ? await db.query.brandMembers.findFirst({
                  where: and(
                      eq(brandMembers.brandId, order.brandId),
                      eq(brandMembers.memberId, userId)
                  ),
                  columns: { id: true },
              })
            : null;
    if (!canViewAllOrders && !brandMembership) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const invoice = await db.query.corporateBrandTaxInvoices.findFirst({
        where: eq(corporateBrandTaxInvoices.orderId, id),
        orderBy: [desc(corporateBrandTaxInvoices.createdAt)],
    });
    if (!invoice)
        return NextResponse.json(
            { message: "Brand tax invoice not found" },
            { status: 404 }
        );
    return NextResponse.redirect(invoice.fileUrl, 307);
}
