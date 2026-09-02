// app/actions/analytics.ts
"use server";

import {
    isCrawlerAnalyticsSuppressionEnabled,
    isLikelyAnalyticsBot,
    mergeMetaUserData,
    reportCapiSuppression,
} from "@/lib/analytics/meta-event-quality";
import {
    createViewContentCapiAfterResponseCaptureScheduler,
    createViewContentCapiAfterResponseScheduler,
    createViewContentCapiSender,
    type CapiRequestData,
} from "@/lib/capi-view-content";
import { productQueries } from "@/lib/db/queries";
import { userQueries } from "@/lib/db/queries/user";
import { CapiCustomData, CapiUserData, sendCapiEvent } from "@/lib/fb-capi";
import { currentUser } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";

export async function getCapiRequestData(): Promise<CapiRequestData> {
    const headersList = await headers();
    const cookieStore = await cookies();
    const userAgent = headersList.get("user-agent") || "";
    // Vercel and many CDNs pass the true client IP in x-real-ip. If missing, fallback to the first x-forwarded-for IP.
    const realIp = headersList.get("x-real-ip");
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = realIp
        ? realIp
        : forwardedFor
          ? forwardedFor.split(",")[0].trim()
          : "0.0.0.0";
    const referer = headersList.get("referer") || "";
    const fbp = cookieStore.get("_fbp")?.value;
    const fbc = cookieStore.get("_fbc")?.value;
    const country =
        headersList.get("x-vercel-ip-country") ||
        headersList.get("x-country") ||
        undefined;
    const state =
        headersList.get("x-vercel-ip-country-region") ||
        headersList.get("x-country-region") ||
        undefined;
    const city =
        headersList.get("x-vercel-ip-city") ||
        headersList.get("x-city") ||
        undefined;

    return { userAgent, ip, referer, fbp, fbc, country, state, city };
}

async function enrichCapiUserData(
    userData: CapiUserData,
    requestData: CapiRequestData
) {
    let primaryAddress:
        | { city?: string; state?: string; zip?: string; phone?: string }
        | undefined;

    if (userData.external_id) {
        try {
            const user = await currentUser();
            if (user && user.id === userData.external_id) {
                const dbUser = await userQueries.getUser(user.id);
                primaryAddress =
                    dbUser?.addresses?.find((address) => address.isPrimary) ||
                    dbUser?.addresses?.[0];
            }
        } catch (error) {
            console.error("Error enriching CAPI data:", error);
        }
    }

    return mergeMetaUserData({
        supplied: userData,
        primaryAddress: primaryAddress
            ? {
                  ct: primaryAddress.city,
                  st: primaryAddress.state,
                  zp: primaryAddress.zip,
                  ph: primaryAddress.phone,
              }
            : undefined,
        geo: {
            country: requestData.country,
            st: requestData.state,
            ct: requestData.city,
        },
    });
}

function shouldSuppressCapiEvent(
    eventName: "AddToCart" | "InitiateCheckout" | "Purchase",
    requestData: CapiRequestData
) {
    const shouldSuppress =
        isCrawlerAnalyticsSuppressionEnabled() &&
        isLikelyAnalyticsBot(requestData.userAgent);
    if (shouldSuppress) reportCapiSuppression(eventName);
    return shouldSuppress;
}

export async function trackAddToCartCapi(
    eventId: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    url: string
) {
    const requestData = await getCapiRequestData();
    if (shouldSuppressCapiEvent("AddToCart", requestData)) return;
    const enrichedUserData = await enrichCapiUserData(userData, requestData);

    await sendCapiEvent(
        "AddToCart",
        {
            ...enrichedUserData,
            client_user_agent: requestData.userAgent,
            client_ip_address: requestData.ip,
            fbp: requestData.fbp,
            fbc: requestData.fbc,
            fb_login_id:
                enrichedUserData.fb_login_id ?? enrichedUserData.external_id,
        },
        customData,
        eventId,
        url
    );
}

export async function trackInitiateCheckoutCapi(
    eventId: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    url: string
) {
    const requestData = await getCapiRequestData();
    if (shouldSuppressCapiEvent("InitiateCheckout", requestData)) return;
    const enrichedUserData = await enrichCapiUserData(userData, requestData);

    await sendCapiEvent(
        "InitiateCheckout",
        {
            ...enrichedUserData,
            client_user_agent: requestData.userAgent,
            client_ip_address: requestData.ip,
            fbp: requestData.fbp,
            fbc: requestData.fbc,
            fb_login_id:
                enrichedUserData.fb_login_id ?? enrichedUserData.external_id,
        },
        customData,
        eventId,
        url
    );
}

export async function trackPurchaseCapi(
    eventId: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    url: string
) {
    const requestData = await getCapiRequestData();
    if (shouldSuppressCapiEvent("Purchase", requestData)) return;
    const enrichedUserData = await enrichCapiUserData(userData, requestData);

    await sendCapiEvent(
        "Purchase",
        {
            ...enrichedUserData,
            client_user_agent: requestData.userAgent,
            client_ip_address: requestData.ip,
            fbp: requestData.fbp,
            fbc: requestData.fbc,
            fb_login_id:
                enrichedUserData.fb_login_id ?? enrichedUserData.external_id,
        },
        customData,
        eventId,
        url
    );
}

const sendViewContentCapi = createViewContentCapiSender(sendCapiEvent);

export async function trackViewContentCapi(
    eventId: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    url: string
) {
    const requestData = await getCapiRequestData();
    await sendViewContentCapi(eventId, userData, customData, url, requestData);
}

const scheduleViewContentCapiAfterResponse =
    createViewContentCapiAfterResponseScheduler(sendViewContentCapi);

const captureAndScheduleViewContentCapiAfterResponseInternal =
    createViewContentCapiAfterResponseCaptureScheduler(
        getCapiRequestData,
        scheduleViewContentCapiAfterResponse
    );

export async function captureAndScheduleViewContentCapiAfterResponse(
    registerAfter: (callback: () => void | Promise<void>) => void,
    eventId: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    url: string,
    requestDataOverride: Partial<Pick<CapiRequestData, "fbc">> = {}
) {
    await captureAndScheduleViewContentCapiAfterResponseInternal(
        registerAfter,
        eventId,
        userData,
        customData,
        url,
        requestDataOverride
    );
}

export async function getOverviewMetrics(dateRange: string = "30d") {
    try {
        return await productQueries.getOverviewMetrics(dateRange);
    } catch (error) {
        console.error("Error fetching overview metrics:", error);
        throw new Error("Failed to fetch overview metrics");
    }
}

export async function getRevenueTrend(dateRange: string = "30d") {
    try {
        return await productQueries.getRevenueTrend(dateRange);
    } catch (error) {
        console.error("Error fetching revenue trend:", error);
        throw new Error("Failed to fetch revenue trend");
    }
}

export async function getBrandPerformance(dateRange: string = "30d") {
    try {
        return await productQueries.getBrandPerformance(dateRange);
    } catch (error) {
        console.error("Error fetching brand performance:", error);
        throw new Error("Failed to fetch brand performance");
    }
}

export async function getTopProducts(
    limit: number = 5,
    dateRange: string = "30d"
) {
    try {
        return await productQueries.getTopProducts(limit, dateRange);
    } catch (error) {
        console.error("Error fetching top products:", error);
        throw new Error("Failed to fetch top products");
    }
}

export async function getTopProductsbySales(
    limit: number = 5,
    dateRange: string = "30d"
) {
    try {
        return await productQueries.getTopProductsbySales(limit, dateRange);
    } catch (error) {
        console.error("Error fetching top products:", error);
        throw new Error("Failed to fetch top products");
    }
}

export async function getProductsByCategory(dateRange: string = "30d") {
    try {
        return await productQueries.getProductsByCategory(dateRange);
    } catch (error) {
        console.error("Error fetching top products:", error);
        throw new Error("Failed to fetch top products");
    }
}

// ✅ Get Products for Conversion Chart
export async function getProductsForConversion(
    limit: number = 10,
    dateRange: string = "30d"
) {
    try {
        return await productQueries.getProductsForConversion(limit, dateRange);
    } catch (error) {
        console.error("Error fetching products for conversion:", error);
        throw new Error("Failed to fetch conversion data");
    }
}

// ✅ Get Products for Funnel Analysis
export async function getProductsForFunnel(
    limit: number = 15,
    dateRange: string = "30d"
) {
    try {
        return await productQueries.getProductsForFunnel(limit, dateRange);
    } catch (error) {
        console.error("Error fetching products for funnel:", error);
        throw new Error("Failed to fetch funnel data");
    }
}

// ✅ Get Products for Conversion Chart
export async function getProductTopByClicks(
    limit: number = 10,
    dateRange: string = "30d"
) {
    try {
        return await productQueries.getTopProductsByClicks(limit, dateRange);
    } catch (error) {
        console.error("Error fetching products for conversion:", error);
        throw new Error("Failed to fetch conversion data");
    }
}
