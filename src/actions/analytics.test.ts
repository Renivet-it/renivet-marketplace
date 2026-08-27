import { readFile } from "node:fs/promises";
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
const viewContent = await import("../lib/capi-view-content");

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
const eventArguments = [
    "event-1",
    userData,
    customData,
    "https://renivet.example/products/product-1",
] as const;

test("request-free ViewContent sender forwards captured request data", async () => {
    const sentEvents: unknown[][] = [];
    const send = async (...args: unknown[]) => {
        sentEvents.push(args);
    };
    const sendViewContent = viewContent.createViewContentCapiSender(send);

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

test("server action module does not export synchronous helper factories", async () => {
    const source = await readFile(
        new URL("./analytics.ts", import.meta.url),
        "utf8"
    );

    expect(source).not.toContain(
        "export function createViewContentCapiSender("
    );
    expect(source).not.toContain(
        "export function createViewContentCapiAfterResponseScheduler("
    );
    expect(source).not.toContain(
        "export function createViewContentCapiAfterResponseCaptureScheduler("
    );
    expect(source).not.toContain(
        "export const scheduleViewContentCapiAfterResponse ="
    );
});

test("product lifecycle captures request data before after registration", async () => {
    const lifecycle: string[] = [];
    let afterCallback: (() => void | Promise<void>) | undefined;
    const schedule =
        viewContent.createViewContentCapiAfterResponseCaptureScheduler(
            async () => {
                lifecycle.push("capture");
                return requestData;
            },
            (registerAfter, ...args) => {
                lifecycle.push("register");
                expect(args).toEqual([...eventArguments, requestData]);
                registerAfter(() => {
                    lifecycle.push("after callback");
                });
            }
        );

    await schedule(
        (callback) => {
            afterCallback = callback;
        },
        ...eventArguments
    );

    expect(lifecycle).toEqual(["capture", "register"]);
    afterCallback!();
    expect(lifecycle).toEqual(["capture", "register", "after callback"]);
});

test("product lifecycle contains request-data capture failures without scheduling", async () => {
    const reports: unknown[][] = [];
    const originalConsoleError = console.error;
    const secret = "sensitive-request-data";
    let registered = false;
    console.error = (...args: unknown[]) => reports.push(args);
    const schedule =
        viewContent.createViewContentCapiAfterResponseCaptureScheduler(
            async () => {
                throw new Error(secret);
            },
            () => {
                registered = true;
            }
        );

    try {
        await expect(
            schedule(
                () => {
                    registered = true;
                },
                ...eventArguments
            )
        ).resolves.toBeUndefined();
        expect(registered).toBe(false);
        expect(reports).toEqual([
            [
                "Failed to capture ViewContent CAPI request data:",
                { errorName: "Error" },
            ],
        ]);
        expect(JSON.stringify(reports)).not.toContain(secret);
    } finally {
        console.error = originalConsoleError;
    }
});

test("post-response ViewContent registration contains synchronous registration failures", () => {
    const reports: unknown[][] = [];
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => reports.push(args);
    const schedule = viewContent.createViewContentCapiAfterResponseScheduler(
        async () => {}
    );

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
    const schedule = viewContent.createViewContentCapiAfterResponseScheduler(
        async () => {
            throw new Error("Meta is unavailable");
        }
    );

    try {
        schedule(
            (callback) => callbacks.push(callback),
            ...eventArguments,
            requestData
        );
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

test("post-response ViewContent callback returns the sender promise", async () => {
    let releaseSender!: () => void;
    let senderFinished = false;
    let callback: (() => void | Promise<void>) | undefined;
    const schedule = viewContent.createViewContentCapiAfterResponseScheduler(
        async () => {
            await new Promise<void>((resolve) => {
                releaseSender = resolve;
            });
            senderFinished = true;
        }
    );

    schedule(
        (registeredCallback) => {
            callback = registeredCallback;
        },
        ...eventArguments,
        requestData
    );

    const senderPromise = callback!();
    expect(senderPromise).toBeInstanceOf(Promise);
    expect(senderFinished).toBe(false);
    releaseSender();
    await senderPromise;
    expect(senderFinished).toBe(true);
});

test("product page captures request data before scheduling after-response CAPI", async () => {
    const pageSource = await readFile(
        new URL("../app/(marketing)/products/[slug]/page.tsx", import.meta.url),
        "utf8"
    );
    const captureCall = pageSource.indexOf(
        "await captureAndScheduleViewContentCapiAfterResponse("
    );
    expect(captureCall).toBeGreaterThan(-1);
    expect(pageSource.replace(/\r\n/g, "\n")).toContain("        after,\n");
    const analyticsSource = await readFile(
        new URL("./analytics.ts", import.meta.url),
        "utf8"
    );
    const viewContentSource = await readFile(
        new URL("../lib/capi-view-content.ts", import.meta.url),
        "utf8"
    );
    expect(
        viewContentSource.indexOf("requestData = await captureRequestData()")
    ).toBeLessThan(viewContentSource.indexOf("scheduleAfterResponse("));
    expect(pageSource).toContain('import { after } from "next/server";');
});

test("public ViewContent wrapper keeps captured request fields in its payload", async () => {
    const source = await readFile(
        new URL("../lib/capi-view-content.ts", import.meta.url),
        "utf8"
    );
    expect(source).toContain('"ViewContent",');
    expect(source).toContain("client_user_agent: requestData.userAgent");
    expect(source).toContain("client_ip_address: requestData.ip");
    expect(source).toContain("fb_login_id: userData.external_id");
});
