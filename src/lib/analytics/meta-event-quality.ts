import type { CapiUserData } from "@/lib/fb-capi";

const BOT_USER_AGENT_PATTERN =
    /(?:facebookexternalhit|meta-externalads|meta-externalagent|googlebot|bingbot|amazonbot|applebot|claudebot|gptbot|ahrefsbot|baiduspider|bytespider|\b(?:bot|crawler|spider)\b)/i;

export type MetaAddressData = Pick<
    CapiUserData,
    "ct" | "st" | "zp" | "country" | "ph"
>;

export type MetaGeoData = Pick<CapiUserData, "ct" | "st" | "country">;

export function isLikelyAnalyticsBot(userAgent: string | undefined) {
    return Boolean(userAgent && BOT_USER_AGENT_PATTERN.test(userAgent));
}

export function isCrawlerAnalyticsSuppressionEnabled(
    environment: Record<string, string | undefined> = process.env
) {
    return environment.META_CAPI_SUPPRESS_CRAWLERS === "true";
}

export function buildFbcFromFbclid({
    existingFbc,
    fbclid,
    timestampMs = Date.now(),
}: {
    existingFbc?: string;
    fbclid?: string;
    timestampMs?: number;
}) {
    if (existingFbc) return existingFbc;
    if (!fbclid?.trim()) return undefined;
    return `fb.1.${timestampMs}.${fbclid.trim()}`;
}

export function mergeMetaUserData({
    supplied,
    profile,
    primaryAddress,
    checkoutAddress,
    geo,
}: {
    supplied?: CapiUserData;
    profile?: CapiUserData;
    primaryAddress?: MetaAddressData;
    checkoutAddress?: MetaAddressData;
    geo?: MetaGeoData;
}): CapiUserData {
    const preferredAddress = checkoutAddress ?? primaryAddress;

    return compactUserData({
        ...profile,
        ...supplied,
        ph:
            supplied?.ph ??
            checkoutAddress?.ph ??
            primaryAddress?.ph ??
            profile?.ph,
        ct: supplied?.ct ?? preferredAddress?.ct ?? geo?.ct,
        st: supplied?.st ?? preferredAddress?.st ?? geo?.st,
        zp: supplied?.zp ?? preferredAddress?.zp,
        country: supplied?.country ?? preferredAddress?.country ?? geo?.country,
    });
}

export function buildPurchaseEventId(completedOrderIds: string[]) {
    const ids = [...new Set(completedOrderIds.filter(Boolean))].sort();
    if (ids.length === 0) {
        throw new Error("completed order identity is required");
    }
    return `purchase:${ids.join(":")}`;
}

function compactUserData(data: CapiUserData): CapiUserData {
    return Object.fromEntries(
        Object.entries(data).filter(
            ([, value]) => value !== undefined && value !== null && value !== ""
        )
    ) as CapiUserData;
}
