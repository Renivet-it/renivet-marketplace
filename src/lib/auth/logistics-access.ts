import {
    canAccessBrandShipment,
    hasBrandOrderAccess,
    isLogisticsStaff,
} from "@/lib/auth/logistics-policy";
import { db } from "@/lib/db";
import { orderShipments } from "@/lib/db/schema";
import { userCache } from "@/lib/redis/methods";
import { getUserPermissions } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

type ShipmentLookup =
    | { orderId: string }
    | { shiprocketShipmentId: number }
    | { waybill: string };

async function getLogisticsUser() {
    const { userId } = await auth();
    if (!userId) {
        return {
            response: NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            ),
        };
    }

    const user = await userCache.get(userId);
    if (!user) {
        return {
            response: NextResponse.json(
                { success: false, message: "Forbidden" },
                { status: 403 }
            ),
        };
    }

    return { user, permissions: getUserPermissions(user.roles) };
}

export async function requireLogisticsStaff() {
    const result = await getLogisticsUser();
    if ("response" in result) return result.response;

    if (!isLogisticsStaff(result.permissions.sitePermissions)) {
        return NextResponse.json(
            { success: false, message: "Forbidden" },
            { status: 403 }
        );
    }

    return null;
}

export async function requireShipmentLogisticsAccess(lookup?: ShipmentLookup) {
    const result = await getLogisticsUser();
    if ("response" in result) return result.response;

    if (isLogisticsStaff(result.permissions.sitePermissions)) return null;

    if (!lookup) {
        return NextResponse.json(
            { success: false, message: "Forbidden" },
            { status: 403 }
        );
    }

    const hasOrderAccess = hasBrandOrderAccess(
        result.permissions.brandPermissions
    );
    if (!hasOrderAccess || !result.user.brand?.id) {
        return NextResponse.json(
            { success: false, message: "Forbidden" },
            { status: 403 }
        );
    }

    const shipment = await db.query.orderShipments.findFirst({
        where:
            "orderId" in lookup
                ? eq(orderShipments.orderId, lookup.orderId)
                : "shiprocketShipmentId" in lookup
                  ? eq(
                        orderShipments.shiprocketShipmentId,
                        lookup.shiprocketShipmentId
                    )
                  : or(
                        eq(orderShipments.awbNumber, lookup.waybill),
                        eq(orderShipments.uploadWbn, lookup.waybill)
                    ),
    });

    if (
        !shipment ||
        !canAccessBrandShipment({
            brandId: result.user.brand.id,
            hasOrderAccess,
            shipmentBrandId: shipment.brandId,
        })
    ) {
        return NextResponse.json(
            { success: false, message: "Forbidden" },
            { status: 403 }
        );
    }

    return null;
}
