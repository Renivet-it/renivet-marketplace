import { expect, test } from "bun:test";
import {
    buildFbcFromFbclid,
    buildMetaProfileUserData,
    buildPurchaseEventId,
    createCapiSuppressionDiagnostic,
    isCrawlerAnalyticsSuppressionEnabled,
    isLikelyAnalyticsBot,
    isValidFbc,
    isValidFbp,
    mergeMetaUserData,
} from "./meta-event-quality";

test("builds all available registered-user profile identifiers", () => {
    expect(
        buildMetaProfileUserData({
            id: "user_1",
            firstName: "Ayan",
            lastName: "Ganguly",
            emailAddresses: [{ emailAddress: "ayan@renivet.com" }],
            phoneNumbers: [{ phoneNumber: "+91 9000000000" }],
            externalAccounts: [
                { provider: "oauth_facebook", externalId: "facebook_1" },
            ],
        })
    ).toEqual({
        em: "ayan@renivet.com",
        ph: "+91 9000000000",
        fn: "Ayan",
        ln: "Ganguly",
        external_id: "user_1",
        fb_login_id: "facebook_1",
    });
});

test("suppresses clear crawler user agents but keeps ordinary browsers eligible", () => {
    expect(
        isLikelyAnalyticsBot(
            "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
        )
    ).toBe(true);
    expect(
        isLikelyAnalyticsBot(
            "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125 Mobile Safari/537.36"
        )
    ).toBe(false);
    expect(
        isLikelyAnalyticsBot(
            "Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 Chrome/91 Mobile Safari/537.36"
        )
    ).toBe(false);
    expect(isLikelyAnalyticsBot("")).toBe(false);
});

test("enables crawler suppression only with the explicit rollout flag", () => {
    expect(isCrawlerAnalyticsSuppressionEnabled({})).toBe(false);
    expect(
        isCrawlerAnalyticsSuppressionEnabled({
            META_CAPI_SUPPRESS_CRAWLERS: "true",
        })
    ).toBe(true);
    expect(
        isCrawlerAnalyticsSuppressionEnabled({
            META_CAPI_SUPPRESS_CRAWLERS: "TRUE",
        })
    ).toBe(false);
});

test("reports crawler suppression without retaining raw request or customer data", () => {
    expect(
        createCapiSuppressionDiagnostic(
            "ViewContent",
            "2026-09-03T00:00:00.000Z"
        )
    ).toEqual({
        eventName: "ViewContent",
        reason: "clear_crawler",
        userAgentCategory: "crawler",
        timestamp: "2026-09-03T00:00:00.000Z",
    });
});

test("creates an fbc only from a real click id and preserves an existing value", () => {
    expect(
        buildFbcFromFbclid({
            existingFbc: "fb.1.1700000000000.existing-click",
            fbclid: "new-click",
            timestampMs: 1711111111111,
        })
    ).toBe("fb.1.1700000000000.existing-click");
    expect(
        buildFbcFromFbclid({ fbclid: "paid-click", timestampMs: 1711111111111 })
    ).toBe("fb.1.1711111111111.paid-click");
    expect(buildFbcFromFbclid({ timestampMs: 1711111111111 })).toBeUndefined();
    expect(
        buildFbcFromFbclid({
            existingFbc: "invalid-cookie",
            fbclid: "paid-click",
            timestampMs: 1711111111111,
        })
    ).toBe("fb.1.1711111111111.paid-click");
    expect(
        buildFbcFromFbclid({
            fbclid: "not a valid click id",
            timestampMs: 1711111111111,
        })
    ).toBeUndefined();
    expect(isValidFbc("not-an-fbc")).toBe(false);
    expect(isValidFbp("not-an-fbp")).toBe(false);
    expect(isValidFbp("fb.1.1558571054389.1098115397")).toBe(true);
});

test("prefers checkout address and only fills missing guest location from trusted geo data", () => {
    expect(
        mergeMetaUserData({
            supplied: {
                ct: "Stale city",
                st: "Stale state",
                zp: "999999",
                country: "US",
                ph: "+1 5550000000",
            },
            profile: {
                em: "profile@renivet.com",
                ph: "+91 9000000000",
                fn: "Profile",
                ln: "User",
                external_id: "user_1",
            },
            primaryAddress: {
                ct: "Delhi",
                st: "Delhi",
                zp: "110001",
                country: "IN",
                ph: "+91 8000000000",
            },
            checkoutAddress: {
                ct: "Mumbai",
                st: "Maharashtra",
                zp: "400001",
                country: "IN",
                ph: "+91 7000000000",
            },
            geo: { country: "US", st: "California", ct: "San Francisco" },
        })
    ).toEqual({
        em: "profile@renivet.com",
        ph: "+91 7000000000",
        fn: "Profile",
        ln: "User",
        external_id: "user_1",
        ct: "Mumbai",
        st: "Maharashtra",
        zp: "400001",
        country: "IN",
    });

    expect(
        mergeMetaUserData({
            supplied: { em: "guest@example.com" },
            geo: { country: "IN", st: "Karnataka", ct: "Bengaluru" },
        })
    ).toEqual({
        em: "guest@example.com",
        country: "IN",
        st: "Karnataka",
        ct: "Bengaluru",
    });
});

test("derives one repeatable Purchase event id from the completed order set", () => {
    expect(buildPurchaseEventId(["order_b", "order_a"])).toBe(
        "purchase:order_a:order_b"
    );
    expect(buildPurchaseEventId(["order_a", "order_b"])).toBe(
        "purchase:order_a:order_b"
    );
    expect(() => buildPurchaseEventId([])).toThrow(
        "completed order identity is required"
    );
});
