import { afterEach, describe, expect, mock, test } from "bun:test";
import { sendProductClickEvent } from "./product-click";

const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator"
);
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

afterEach(() => {
    if (originalNavigator) {
        Object.defineProperty(globalThis, "navigator", originalNavigator);
    } else {
        Reflect.deleteProperty(globalThis, "navigator");
    }
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
});

describe("sendProductClickEvent", () => {
    test("prefers sendBeacon and sends only product and brand identifiers", async () => {
        let requestUrl = "";
        let requestBody: Blob | undefined;
        const sendBeacon = mock((url: string, body: Blob) => {
            requestUrl = url;
            requestBody = body;
            return true;
        });

        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: { sendBeacon },
        });

        sendProductClickEvent("product-1", "brand-1");

        expect(requestUrl).toBe("/api/products/track-click");
        expect(await requestBody?.text()).toBe(
            JSON.stringify({ productId: "product-1", brandId: "brand-1" })
        );
        expect(globalThis.fetch).toBe(originalFetch);
    });

    test("falls back to keepalive fetch and swallows transport failures", async () => {
        Object.defineProperty(globalThis, "navigator", {
            configurable: true,
            value: {},
        });
        const fetchMock = mock(async () => {
            throw new Error("network unavailable");
        });
        const consoleError = mock();
        console.error = consoleError;
        globalThis.fetch = fetchMock as typeof fetch;

        expect(() =>
            sendProductClickEvent("product-2", "brand-2")
        ).not.toThrow();
        await new Promise((resolve) => setImmediate(resolve));

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/products/track-click",
            expect.objectContaining({
                body: JSON.stringify({
                    productId: "product-2",
                    brandId: "brand-2",
                }),
                keepalive: true,
                method: "POST",
            })
        );
        expect(consoleError).toHaveBeenCalledWith(
            "Failed to track click:",
            expect.any(Error)
        );
    });
});
