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
        const sanitizedParams = sanitizeFbUserData(params);
        if (options?.eventId) {
            window.fbq("track", name, sanitizedParams, {
                eventID: options.eventId,
            });
        } else {
            window.fbq("track", name, sanitizedParams);
        }
    }
};

export const sanitizeFbUserData = (data: Record<string, any> = {}) => {
    const isDummyEmail = (em: string) =>
        /^(test|dummy|example|admin|user)@/i.test(em) ||
        em.endsWith("example.com");
    const isDummyPhone = (ph: string) => /^0{5,}|1{5,}|12345|^999999/.test(ph);

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null || value === "") continue;

        if (typeof value === "string") {
            const cleanVal = value.trim().toLowerCase();
            if (
                cleanVal === "" ||
                cleanVal === "undefined" ||
                cleanVal === "null"
            )
                continue;

            if (key === "em" && isDummyEmail(cleanVal)) continue;
            if (key === "ph") {
                const cleanPh = cleanVal.replace(/[^0-9]/g, ""); // Keep only digits
                if (!cleanPh || isDummyPhone(cleanPh) || cleanPh.length < 5)
                    continue;
                sanitized[key] = cleanPh;
                continue;
            }

            sanitized[key] = cleanVal;
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
};
