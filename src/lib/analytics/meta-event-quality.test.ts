import { expect, test } from "bun:test";
import {
    buildFbcFromFbclid,
    buildPurchaseEventId,
    isCrawlerAnalyticsSuppressionEnabled,
    isLikelyAnalyticsBot,
    mergeMetaUserData,
} from "./meta-event-quality";

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
});

test("prefers checkout address and only fills missing guest location from trusted geo data", () => {
    expect(
        mergeMetaUserData({
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
