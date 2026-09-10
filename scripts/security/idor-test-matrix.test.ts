import { describe, expect, test } from "bun:test";
import {
    IDOR_MANIFEST_VERSION,
    idorMatrix,
    normalizeHttpOutcome,
    validateFixtureContract,
    validateMatrix,
    validateTargetOrigin,
    buildApiRequest,
    buildBrowserUrl,
} from "./idor-test-matrix";
import { normalizeBrowserSignals } from "./run-idor-browser-matrix";

describe("REN-124 IDOR matrix contract", () => {
    test("covers every resource and access mode with scoped case metadata", () => {
        expect(validateMatrix(idorMatrix)).toEqual([]);
        expect(new Set(idorMatrix.map((item) => item.resource))).toEqual(
            new Set([
                "order",
                "invoice",
                "corporate_quote",
                "payment_request",
                "address",
                "cart",
            ])
        );
        expect(
            new Set(idorMatrix.map((item) => item.accessMode))
        ).toEqual(
            new Set([
                "unauthenticated",
                "wrong_user",
                "owner",
                "tampered_identifier",
            ])
        );
        expect(idorMatrix.every((item) => item.persona && item.fixtureRef)).toBe(
            true
        );
        expect(idorMatrix.some((item) => item.scope === "brand" && item.persona === "unrelated_brand")).toBe(true);
        expect(idorMatrix.some((item) => item.scope === "admin" && item.persona === "privileged_admin")).toBe(true);
    });

    test("rejects duplicate or mutating matrix cases", () => {
        const invalid = idorMatrix.map((item, index) =>
            index === 0
                ? { ...item, id: idorMatrix[1].id }
                : index === 1
                  ? { ...item, mutating: true }
                  : item
        );
        expect(validateMatrix(invalid as unknown as typeof idorMatrix)).toEqual([
            "duplicate case id",
            "mutating case is not allowed",
        ]);
    });

    test("binds browser resources to their real resource routes", () => {
        const fixtures = {
            ownerUserId: "owner",
            wrongUserId: "wrong",
            ownerBrandId: "brand-a",
            wrongBrandId: "brand-b",
            resources: {
                order: { id: "order-1", ownerUserId: "owner", tamperedId: "order-2" },
                invoice: {
                    orderId: "order-1",
                    ownerUserId: "owner",
                    token: "invoice-token",
                    wrongToken: "wrong-token",
                    mismatchOrderId: "order-2",
                },
                corporateQuote: {
                    id: "quote-1",
                    ownerUserId: "owner",
                    ownerBrandId: "brand-a",
                    tamperedId: "quote-2",
                },
                paymentRequest: {
                    token: "secret-token",
                    wrongToken: "wrong-secret-token",
                    status: "open" as const,
                },
                address: { id: "address-1", ownerUserId: "owner", tamperedId: "address-2" },
                cart: { ownerUserId: "owner", tamperedUserId: "wrong" },
            },
        };
        const orderCase = idorMatrix.find(
            (item) => item.resource === "order" && item.accessMode === "owner"
        )!;
        const quoteCase = idorMatrix.find(
            (item) => item.resource === "corporate_quote" && item.accessMode === "owner"
        )!;

        expect(new URL(buildBrowserUrl(orderCase, "http://localhost:3000", fixtures)).pathname).toBe(
            "/orders/order-1"
        );
        expect(new URL(buildBrowserUrl(quoteCase, "http://localhost:3000", fixtures)).searchParams.get("quoteId")).toBe(
            "quote-1"
        );
    });

    test("classifies HTTP and tRPC authorization results without body inspection", () => {
        expect(normalizeHttpOutcome({ status: 200 })).toBe("allow");
        expect(normalizeHttpOutcome({ status: 401 })).toBe("unauthorized");
        expect(normalizeHttpOutcome({ status: 403 })).toBe("forbidden");
        expect(normalizeHttpOutcome({ status: 404 })).toBe("not_found");
        expect(normalizeHttpOutcome({ status: 400 })).toBe("validation_error");
        expect(normalizeHttpOutcome({ status: 302 })).toBe("redirect");
        expect(
            normalizeHttpOutcome({ status: 200, trpcCode: "FORBIDDEN" })
        ).toBe("forbidden");
        expect(normalizeHttpOutcome({ status: 503 })).toBe("error");
    });

    test("fails closed for unsafe or unallowlisted target origins", () => {
        expect(validateTargetOrigin("http://localhost:3000", ["http://localhost:3000"])).toEqual({
            origin: "http://localhost:3000",
            local: true,
        });
        expect(() =>
            validateTargetOrigin("https://renivet.com", ["https://renivet.com"])
        ).toThrow("non-local target acknowledgement");
        expect(() =>
            validateTargetOrigin("http://127.0.0.1:3000", ["http://localhost:3000"])
        ).toThrow("not in IDOR_ALLOWED_ORIGINS");
        expect(() =>
            validateTargetOrigin("https://example.com", ["https://example.com"], {
                allowNonLocal: true,
                acknowledgement: "REN-124-STAGING",
            })
        ).not.toThrow();
    });

    test("validates fixture ownership and distinct test identities", () => {
        const fixtures = {
            ownerUserId: "owner",
            wrongUserId: "wrong",
            ownerBrandId: "brand-a",
            wrongBrandId: "brand-b",
            resources: {
                order: { id: "order-1", ownerUserId: "owner", tamperedId: "order-2" },
                invoice: {
                    orderId: "order-1",
                    ownerUserId: "owner",
                    token: "invoice-token",
                    wrongToken: "wrong-token",
                    mismatchOrderId: "order-2",
                },
                corporateQuote: {
                    id: "quote-1",
                    ownerUserId: "owner",
                    ownerBrandId: "brand-a",
                    tamperedId: "quote-2",
                },
                paymentRequest: {
                    token: "secret-token",
                    wrongToken: "wrong-secret-token",
                    status: "open",
                },
                address: {
                    id: "address-1",
                    ownerUserId: "owner",
                    tamperedId: "address-2",
                },
                cart: { ownerUserId: "owner", tamperedUserId: "tampered" },
            },
        } as const;
        expect(validateFixtureContract(fixtures)).toEqual([]);
        expect(
            validateFixtureContract({ ...fixtures, wrongUserId: "owner" })
        ).toContain("owner and wrong-user identities must differ");
    });

    test("exposes a stable manifest version for evidence correlation", () => {
        expect(IDOR_MANIFEST_VERSION).toMatch(/^ren-124-v\d+$/);
    });

    test("builds read-only API requests from fixture references without emitting secrets", () => {
        const request = buildApiRequest(
            idorMatrix.find((item) => item.id === "REN-124-address-owner")!,
            "http://localhost:3000",
            {
                ownerUserId: "owner",
                wrongUserId: "wrong",
                ownerBrandId: "brand-a",
                wrongBrandId: "brand-b",
                resources: {
                    order: { id: "order-1", ownerUserId: "owner", tamperedId: "order-2" },
                    invoice: {
                        orderId: "order-1",
                        ownerUserId: "owner",
                        token: "invoice-token",
                        wrongToken: "wrong-token",
                        mismatchOrderId: "order-2",
                    },
                    corporateQuote: {
                        id: "quote-1",
                        ownerUserId: "owner",
                        ownerBrandId: "brand-a",
                        tamperedId: "quote-2",
                    },
                    paymentRequest: { token: "payment-token", wrongToken: "wrong-payment-token", status: "open" },
                    address: { id: "address-1", ownerUserId: "owner", tamperedId: "address-2" },
                    cart: { ownerUserId: "owner", tamperedUserId: "tampered" },
                },
            }
        );
        expect(request.url).toContain("/api/trpc/general.addresses.getAddressById");
        expect(request.url).toContain("addressId");
        expect(request.method).toBe("GET");
        expect(request.url).not.toContain("owner");
        expect(request.headers).toEqual({});
    });

    test("classifies browser denial signals without collecting page content", () => {
        expect(
            normalizeBrowserSignals({
                finalUrl: "http://localhost:3000/orders/1",
                unauthorized: false,
                forbidden: true,
                notFound: false,
            })
        ).toBe("forbidden");
        expect(
            normalizeBrowserSignals({
                finalUrl: "http://localhost:3000/profile/corporate?quoteId=quote-2",
                unauthorized: false,
                forbidden: false,
                notFound: false,
                resourceFound: false,
            })
        ).toBe("forbidden");
        expect(
            normalizeBrowserSignals({
                finalUrl: "http://localhost:3000/auth/signin",
                unauthorized: false,
                forbidden: false,
                notFound: false,
            })
        ).toBe("unauthorized");
    });
});
