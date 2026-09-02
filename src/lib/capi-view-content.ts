import {
    isCrawlerAnalyticsSuppressionEnabled,
    isLikelyAnalyticsBot,
    reportCapiSuppression,
} from "@/lib/analytics/meta-event-quality";
import { CapiCustomData, CapiUserData } from "@/lib/fb-capi";

export type CapiRequestData = {
    userAgent: string;
    ip: string;
    referer: string;
    fbp?: string;
    fbc?: string;
    country?: string;
    state?: string;
    city?: string;
};

type CapiEventSender = (
    eventName: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    eventId: string,
    url: string
) => Promise<unknown>;

type ViewContentCapiSender = (
    eventId: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    url: string,
    requestData: CapiRequestData
) => Promise<unknown>;

export type ViewContentCapiAfterResponseScheduler = (
    registerAfter: (callback: () => void | Promise<void>) => void,
    eventId: string,
    userData: CapiUserData,
    customData: CapiCustomData,
    url: string,
    requestData: CapiRequestData
) => void;

export function createViewContentCapiSender(
    send: CapiEventSender
): ViewContentCapiSender {
    return async (eventId, userData, customData, url, requestData) => {
        if (
            isCrawlerAnalyticsSuppressionEnabled() &&
            isLikelyAnalyticsBot(requestData.userAgent)
        ) {
            reportCapiSuppression("ViewContent");
            return;
        }

        await send(
            "ViewContent",
            {
                ...userData,
                client_user_agent: requestData.userAgent,
                client_ip_address: requestData.ip,
                fbp: requestData.fbp,
                fbc: requestData.fbc,
                fb_login_id: userData.external_id,
                country: userData.country || requestData.country,
                st: userData.st || requestData.state,
                ct: userData.ct || requestData.city,
            },
            customData,
            eventId,
            url
        );
    };
}

export function createViewContentCapiAfterResponseScheduler(
    send: ViewContentCapiSender
): ViewContentCapiAfterResponseScheduler {
    return (registerAfter, eventId, userData, customData, url, requestData) => {
        try {
            registerAfter(() => {
                return send(eventId, userData, customData, url, requestData)
                    .then(() => undefined)
                    .catch((error) =>
                        console.error("Failed to send ViewContent CAPI:", error)
                    );
            });
        } catch (error) {
            console.error("Failed to schedule ViewContent CAPI:", error);
        }
    };
}

export function createViewContentCapiAfterResponseCaptureScheduler(
    captureRequestData: () => Promise<CapiRequestData>,
    scheduleAfterResponse: ViewContentCapiAfterResponseScheduler
) {
    return async (
        registerAfter: (callback: () => void | Promise<void>) => void,
        eventId: string,
        userData: CapiUserData,
        customData: CapiCustomData,
        url: string,
        requestDataOverride: Partial<CapiRequestData> = {}
    ) => {
        let requestData: CapiRequestData;

        try {
            requestData = await captureRequestData();
        } catch (error) {
            console.error("Failed to capture ViewContent CAPI request data:", {
                errorName: error instanceof Error ? error.name : "UnknownError",
            });
            return;
        }

        scheduleAfterResponse(
            registerAfter,
            eventId,
            userData,
            customData,
            url,
            { ...requestData, ...requestDataOverride }
        );
    };
}
