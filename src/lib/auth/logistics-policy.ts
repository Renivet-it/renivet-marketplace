import {
    BitFieldBrandPermission,
    BitFieldSitePermission,
} from "@/config/permissions";
import { hasPermission } from "@/lib/utils";

export function isLogisticsStaff(sitePermissions: number) {
    return hasPermission(sitePermissions, [
        BitFieldSitePermission.MANAGE_ORDERS,
    ]);
}

export function hasBrandOrderAccess(brandPermissions: number) {
    return hasPermission(brandPermissions, [
        BitFieldBrandPermission.VIEW_ORDERS,
    ]);
}

export function canAccessBrandShipment({
    brandId,
    hasOrderAccess,
    shipmentBrandId,
}: {
    brandId: string | null | undefined;
    hasOrderAccess: boolean;
    shipmentBrandId: string;
}) {
    return hasOrderAccess && brandId === shipmentBrandId;
}
