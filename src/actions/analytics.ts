// app/actions/analytics.ts
"use server";

import { productQueries } from "@/lib/db/queries";
import { userQueries } from "@/lib/db/queries/user";
import { CapiCustomData, CapiUserData, sendCapiEvent } from "@/lib/fb-capi";
import { currentUser } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";

const getRequestData = async () => {
    const headersList = await headers();
    const cookieStore = await cookies();
    const userAgent = headersList.get("user-agent") || "";
    // X-Forwarded-For is often a list, take the first one
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "0.0.0.0";
    const referer = headersList.get("referer") || "";
    const fbp = cookieStore.get("_fbp")?.value;
    const fbc = cookieStore.get("_fbc")?.value;
    const country =
        headersList.get("x-vercel-ip-country") ||
        headersList.get("x-country") ||
        undefined;

    return { userAgent, ip, referer, fbp, fbc, country };
};

export async function trackAddToCartCapi(
    eventId: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    url: string
) {
    const { userAgent, ip, fbp, fbc } = await getRequestData();
    let enrichedUserData = { ...userData };

    if (userData.external_id) {
        try {
            const user = await currentUser();
            if (user && user.id === userData.external_id) {
                const dbUser = await userQueries.getUser(user.id);
                const primaryAddress =
                    dbUser?.addresses?.find((a) => a.isPrimary) ||
                    dbUser?.addresses?.[0];

                if (primaryAddress) {
                    enrichedUserData = {
                        ...enrichedUserData,
                        ct: primaryAddress.city,
                        st: primaryAddress.state,
                        zp: primaryAddress.zip,
                        ph:
                            enrichedUserData.ph ||
                            primaryAddress.phone ||
                            undefined,
                    };
                }
            }
        } catch (error) {
            console.error("Error enriching CAPI data:", error);
        }
    }

    await sendCapiEvent(
        "AddToCart",
        {
            ...enrichedUserData,
            client_user_agent: userAgent,
            client_ip_address: ip,
            fbp,
            fbc,
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
    const { userAgent, ip, fbp, fbc } = await getRequestData();
    let enrichedUserData = { ...userData };

    if (userData.external_id) {
        try {
            const user = await currentUser();
            if (user && user.id === userData.external_id) {
                const dbUser = await userQueries.getUser(user.id);
                const primaryAddress =
                    dbUser?.addresses?.find((a) => a.isPrimary) ||
                    dbUser?.addresses?.[0];

                if (primaryAddress) {
                    enrichedUserData = {
                        ...enrichedUserData,
                        ct: enrichedUserData.ct || primaryAddress.city,
                        st: enrichedUserData.st || primaryAddress.state,
                        zp: enrichedUserData.zp || primaryAddress.zip,
                        ph:
                            enrichedUserData.ph ||
                            primaryAddress.phone ||
                            undefined,
                    };
                }
            }
        } catch (error) {
            console.error("Error enriching CAPI data:", error);
        }
    }

    await sendCapiEvent(
        "InitiateCheckout",
        {
            ...enrichedUserData,
            client_user_agent: userAgent,
            client_ip_address: ip,
            fbp,
            fbc,
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
    const { userAgent, ip, fbp, fbc, country } = await getRequestData();

    await sendCapiEvent(
        "Purchase",
        {
            ...userData,
            client_user_agent: userAgent,
            client_ip_address: ip,
            fbp,
            fbc,
            country: userData.country || country,
        },
        customData,
        eventId,
        url
    );
}

export async function trackViewContentCapi(
    eventId: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    url: string
) {
    const { userAgent, ip, fbp, fbc, country } = await getRequestData();

    await sendCapiEvent(
        "ViewContent",
        {
            ...userData,
            client_user_agent: userAgent,
            client_ip_address: ip,
            fbp,
            fbc,
            country: userData.country || country,
        },
        customData,
        eventId,
        url
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
