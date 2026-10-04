import { describe, expect, test } from "bun:test";
import {
    canonicalJson,
    computePayoutBasisFingerprint,
    getContributingReferencesDigest,
    getPayoutAuthority,
    type PayoutBasisBrand,
} from "./payout-basis";

function brand(overrides: Partial<PayoutBasisBrand> = {}): PayoutBasisBrand {
    return {
        brandId: "brand-1",
        netPayablePaise: 89_900,
        grossSalesPaise: 100_000,
        commissionPaise: 10_000,
        paymentFeePaise: 0,
        returnsPaise: 0,
        carrierClaimsPaise: 0,
        holdbackPaise: 0,
        holdbackReleasePaise: 0,
        overrideNetPaise: 0,
        tdsPaise: 100,
        payoutMethod: "razorpay_route",
        metadata: {
            bankAccountNumber: "111100001111",
            bankIfscCode: "HDFC0000001",
            bankAccountHolderName: "Brand One Pvt Ltd",
            confidentialVerificationStatus: "approved",
        },
        lineItems: [
            { lineType: "sale", referenceId: "order-1", amountPaise: 100_000 },
            { lineType: "commission", referenceId: "order-1", amountPaise: -10_000 },
        ],
        ...overrides,
    };
}

describe("REN-253 payout basis fingerprint", () => {
    const base = computePayoutBasisFingerprint("cycle-1", [brand()]);

    test("is deterministic and independent of brand and line order", () => {
        expect(computePayoutBasisFingerprint("cycle-1", [brand()])).toBe(base);
        const reordered = brand({ lineItems: [...(brand().lineItems ?? [])].reverse() });
        expect(computePayoutBasisFingerprint("cycle-1", [reordered])).toBe(base);
        const other = brand({ brandId: "brand-0" });
        expect(computePayoutBasisFingerprint("cycle-1", [brand(), other])).toBe(
            computePayoutBasisFingerprint("cycle-1", [other, brand()])
        );
    });

    test("ignores state that is not payout-defining", () => {
        const withState = {
            ...brand(),
            executionStatus: "completed",
            reviewStatus: "approved",
            transactionId: "pout_1",
            approvedBy: "finance-2",
        } as PayoutBasisBrand;
        expect(computePayoutBasisFingerprint("cycle-1", [withState])).toBe(base);
    });

    test("changes with the cycle, the brand set and every payout-defining field", () => {
        expect(computePayoutBasisFingerprint("cycle-2", [brand()])).not.toBe(base);
        expect(computePayoutBasisFingerprint("cycle-1", [brand(), brand({ brandId: "b2" })])).not.toBe(base);
        const changes: Array<[string, Partial<PayoutBasisBrand>]> = [
            ["amount", { netPayablePaise: 89_901 }],
            ["gross", { grossSalesPaise: 100_001 }],
            ["commission", { commissionPaise: 10_001 }],
            ["payment fee", { paymentFeePaise: 1 }],
            ["returns", { returnsPaise: 1 }],
            ["carrier claims", { carrierClaimsPaise: 1 }],
            ["holdback", { holdbackPaise: 1 }],
            ["holdback release", { holdbackReleasePaise: 1 }],
            ["override", { overrideNetPaise: 1 }],
            ["tds", { tdsPaise: 101 }],
            ["payout method", { payoutMethod: "manual_neft" }],
            ["account number", { metadata: { ...brand().metadata, bankAccountNumber: "999900009999" } }],
            ["ifsc", { metadata: { ...brand().metadata, bankIfscCode: "ICIC0000002" } }],
            ["holder", { metadata: { ...brand().metadata, bankAccountHolderName: "Other" } }],
            ["verification", { metadata: { ...brand().metadata, confidentialVerificationStatus: "pending" } }],
            [
                "order membership",
                {
                    lineItems: [
                        { lineType: "sale", referenceId: "order-OTHER", amountPaise: 100_000 },
                        { lineType: "commission", referenceId: "order-1", amountPaise: -10_000 },
                    ],
                },
            ],
        ];
        for (const [label, change] of changes) {
            expect(computePayoutBasisFingerprint("cycle-1", [brand(change)])).not.toBe(base);
            expect(label).toBeTruthy();
        }
    });

    test("an order swap with identical totals changes the references digest but not the amounts", () => {
        const swapped = brand({
            lineItems: [
                { lineType: "sale", referenceId: "order-OTHER", amountPaise: 100_000 },
                { lineType: "commission", referenceId: "order-1", amountPaise: -10_000 },
            ],
        });
        const before = getPayoutAuthority(brand());
        const after = getPayoutAuthority(swapped);
        expect(after.netPayablePaise).toBe(before.netPayablePaise);
        expect(after.referencesDigest).not.toBe(before.referencesDigest);
        expect(getContributingReferencesDigest(swapped)).toBe(after.referencesDigest);
    });

    test("canonical JSON sorts keys at every level and keeps array order", () => {
        expect(canonicalJson({ b: 1, a: { d: [2, 1], c: null } })).toBe('{"a":{"c":null,"d":[2,1]},"b":1}');
        expect(canonicalJson({ x: undefined })).toBe('{"x":null}');
    });

    test("the fingerprint is a hash: it does not contain the account number", () => {
        expect(base).toMatch(/^[0-9a-f]{64}$/);
        expect(base).not.toContain("111100001111");
    });
});
