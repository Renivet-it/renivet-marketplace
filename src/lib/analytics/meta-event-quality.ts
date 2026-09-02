import type { CapiUserData } from "@/lib/fb-capi";

const BOT_USER_AGENT_PATTERN =
    /(?:facebookexternalhit|meta-externalads|meta-externalagent|googlebot|bingbot|amazonbot|applebot|claudebot|gptbot|ahrefsbot|baiduspider|bytespider|\b(?:bot|crawler|spider)\b)/i;
const FBC_PATTERN = /^fb\.\d+\.\d{13}\.[A-Za-z0-9._-]+$/;
const FBP_PATTERN = /^fb\.\d+\.\d{13}\.\d+$/;
const FBCLID_PATTERN = /^[A-Za-z0-9._-]{1,500}$/;

export type MetaAddressData = Pick<
    CapiUserData,
    "ct" | "st" | "zp" | "country" | "ph"
>;

export type MetaGeoData = Pick<CapiUserData, "ct" | "st" | "country">;

type MetaProfileSource = {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    emailAddresses?: Array<{ emailAddress?: string | null }>;
    phoneNumbers?: Array<{ phoneNumber?: string | null }>;
    externalAccounts?: Array<{
        provider?: string | null;
        externalId?: string | null;
    }>;
};

export function isLikelyAnalyticsBot(userAgent: string | undefined) {
    return Boolean(userAgent && BOT_USER_AGENT_PATTERN.test(userAgent));
}

export function isCrawlerAnalyticsSuppressionEnabled(
    environment: Record<string, string | undefined> = process.env
) {
    return environment.META_CAPI_SUPPRESS_CRAWLERS === "true";
}

export function createCapiSuppressionDiagnostic(
    eventName: string,
    timestamp: string = new Date().toISOString()
) {
    return {
        eventName,
        reason: "clear_crawler" as const,
        userAgentCategory: "crawler" as const,
        timestamp,
    };
}

export function reportCapiSuppression(eventName: string) {
    console.info(
        "Meta CAPI event suppressed:",
        createCapiSuppressionDiagnostic(eventName)
    );
}

export function buildMetaProfileUserData(
    user: MetaProfileSource
): CapiUserData {
    return compactUserData({
        em: user.emailAddresses?.[0]?.emailAddress ?? undefined,
        ph: user.phoneNumbers?.[0]?.phoneNumber ?? undefined,
        fn: user.firstName ?? undefined,
        ln: user.lastName ?? undefined,
        external_id: user.id,
        fb_login_id:
            user.externalAccounts?.find(
                (account) => account.provider === "oauth_facebook"
            )?.externalId ?? undefined,
    });
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
    const normalizedFbc = existingFbc?.trim();
    if (normalizedFbc && isValidFbc(normalizedFbc)) return normalizedFbc;

    const normalizedFbclid = fbclid?.trim();
    if (!normalizedFbclid || !FBCLID_PATTERN.test(normalizedFbclid))
        return undefined;
    return `fb.1.${timestampMs}.${normalizedFbclid}`;
}

export function isValidFbc(value: string) {
    return FBC_PATTERN.test(value);
}

export function isValidFbp(value: string) {
    return FBP_PATTERN.test(value);
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
    return compactUserData({
        ...profile,
        ...supplied,
        ph:
            checkoutAddress?.ph ??
            supplied?.ph ??
            primaryAddress?.ph ??
            profile?.ph,
        ct:
            checkoutAddress?.ct ??
            supplied?.ct ??
            primaryAddress?.ct ??
            geo?.ct,
        st:
            checkoutAddress?.st ??
            supplied?.st ??
            primaryAddress?.st ??
            geo?.st,
        zp: checkoutAddress?.zp ?? supplied?.zp ?? primaryAddress?.zp,
        country:
            checkoutAddress?.country ??
            supplied?.country ??
            primaryAddress?.country ??
            geo?.country,
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
