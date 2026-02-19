export const FB_PIXEL_ID =
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "618442627790500";

declare global {
    interface Window {
        fbq?: (...args: any[]) => void;
    }
}

export const pageview = () => {
    if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "PageView");
    }
};

export const fbEvent = (
    name: string,
    params: Record<string, any> = {},
    options?: { eventId?: string }
) => {
    if (typeof window !== "undefined" && window.fbq) {
        if (options?.eventId) {
            window.fbq("track", name, params, { eventID: options.eventId });
        } else {
            window.fbq("track", name, params);
        }
    }
};
