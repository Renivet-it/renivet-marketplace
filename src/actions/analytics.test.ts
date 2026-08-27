import { expect, test } from "bun:test";

Object.assign(process.env, {
    CLERK_SECRET_KEY: "test",
    SVIX_SECRET: "test",
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    UPLOADTHING_TOKEN: "test",
    JWT_SECRET_KEY: "test",
    GOOGLE_ANALYTICS_ID: "test",
    FACEBOOK_CAPI_ACCESS_TOKEN: "test-access-token",
    RESEND_API_KEY: "test",
    RAZOR_PAY_KEY_ID: "test",
    RAZOR_PAY_SECRET_KEY: "test",
    RAZOR_PAY_WEBHOOK_SECRET: "test",
    RESEND_EMAIL_FROM: "test@example.com",
    RENIVET_EMAIL_1: "one@example.com",
    RENIVET_EMAIL_2: "two@example.com",
    SHIPROCKET_LOGIN_EMAIL: "test@example.com",
    SHIPROCKET_LOGIN_PASSWORD: "test",
    SHIPROCKET_WEBHOOK_API_KEY: "test",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "test",
    NEXT_PUBLIC_RAZOR_PAY_KEY_ID: "test",
    NEXT_PUBLIC_FACEBOOK_APP_ID: "test",
    NEXT_PUBLIC_POSTHOG_KEY: "test",
    NEXT_PUBLIC_POSTHOG_HOST: "https://example.com",
});

const analytics = await import("./analytics");

const requestData = {
    userAgent: "Mozilla/5.0",
    ip: "203.0.113.10",
    referer: "https://renivet.example/shop",
    fbp: "fb.1.123.456",
    fbc: "fb.1.123.789",
    country: "IN",
};
const userData = { em: "buyer@example.com", external_id: "user-1" };
const customData = { content_ids: ["product-1"], value: 42, currency: "INR" };
const eventArguments = ["event-1", userData, customData, "https://renivet.example/products/product-1"] as const;

test("request-free ViewContent sender forwards captured request data", async () => {
    const sentEvents: unknown[][] = [];
    const send = async (...args: unknown[]) => {
        sentEvents.push(args);
    };
    const sendViewContent = analytics.createViewContentCapiSender(send);

    await sendViewContent(...eventArguments, requestData);

    expect(sentEvents).toEqual([
        [
            "ViewContent",
            {
                ...userData,
                client_user_agent: "Mozilla/5.0",
                client_ip_address: "203.0.113.10",
                fbp: "fb.1.123.456",
                fbc: "fb.1.123.789",
                fb_login_id: "user-1",
                country: "IN",
            },
            customData,
            "event-1",
            "https://renivet.example/products/product-1",
        ],
    ]);
});

test("all public analytics wrappers retain four arguments", () => {
    expect(analytics.trackAddToCartCapi.length).toBe(4);
    expect(analytics.trackInitiateCheckoutCapi.length).toBe(4);
    expect(analytics.trackPurchaseCapi.length).toBe(4);
    expect(analytics.trackViewContentCapi.length).toBe(4);
});

test("post-response ViewContent registration contains synchronous registration failures", () => {
    const reports: unknown[][] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => reports.push(args);
    const schedule = analytics.createViewContentCapiAfterResponseScheduler(async () => {});

    try {
        expect(() =>
            schedule(
                () => {
                    throw new Error("after is unavailable");
                },
                ...eventArguments,
                requestData
            )
        ).not.toThrow();
        expect(reports).toEqual([
            [
                "Failed to schedule ViewContent CAPI:",
                expect.objectContaining({ message: "after is unavailable" }),
            ],
        ]);
    } finally {
        console.error = originalConsoleError;
    }
});

test("post-response ViewContent callback contains sender rejection", async () => {
    const callbacks: Array<() => void> = [];
    const reports: unknown[][] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => reports.push(args);
    const schedule = analytics.createViewContentCapiAfterResponseScheduler(async () => {
        throw new Error("Meta is unavailable");
    });

    try {
        schedule((callback) => callbacks.push(callback), ...eventArguments, requestData);
        callbacks[0]!();
        await Promise.resolve();
        await Promise.resolve();

        expect(reports).toEqual([
            [
                "Failed to send ViewContent CAPI:",
                expect.objectContaining({ message: "Meta is unavailable" }),
            ],
        ]);
    } finally {
        console.error = originalConsoleError;
    }
});
