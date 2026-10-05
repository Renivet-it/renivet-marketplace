import { createHash } from "node:crypto";

// The payout basis (REN-253 G-1, G-2, G-4) is everything an approver and a BIZ-3 clearer
// sign off for a cycle: for each brand how much is paid and how it was derived (the
// contributing source records, not only their sum), to whom, and by which method, plus
// the payee's verification state as it was calculated. It is derived only from the stored
// cycle summary, never from mutable execution or approval state, so an approval or an
// execution step does not change it but any recalculation that changes what is paid, to
// whom, or from which records does.

export const PAYOUT_BASIS_VERSION = "renivet-payout-basis-v1";

export type PayoutBasisBrand = {
    brandId: string;
    netPayablePaise: number;
    grossSalesPaise: number;
    commissionPaise: number;
    paymentFeePaise: number;
    returnsPaise: number;
    carrierClaimsPaise: number;
    holdbackPaise: number;
    holdbackReleasePaise: number;
    overrideNetPaise: number;
    tdsPaise: number;
    payoutMethod: string;
    metadata?: Record<string, unknown> | null;
    lineItems?: Array<{
        lineType: string;
        referenceId?: string | null;
        amountPaise: number;
    }> | null;
};

function sha256(value: string) {
    return createHash("sha256").update(value).digest("hex");
}

// Deterministic JSON: object keys sorted at every level; arrays keep their order.
export function canonicalJson(value: unknown): string {
    if (value === null || typeof value !== "object") {
        return JSON.stringify(value === undefined ? null : value);
    }
    if (Array.isArray(value)) {
        return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
    }
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
        .join(",")}}`;
}

// Digest of every line item that contributes to the brand's payout (sale, commission,
// refund, claim, override, holdback, TDS ...): its type, source record reference and
// amount. Order membership is therefore part of the basis: swapping one order for another
// of identical value changes the digest.
export function getContributingReferencesDigest(brand: PayoutBasisBrand) {
    const lines = (brand.lineItems ?? []).map(
        (line) => `${line.lineType}|${line.referenceId ?? ""}|${line.amountPaise}`
    );
    return sha256(lines.sort().join("\n"));
}

// The fields execution sends to the provider or prints on the manual NEFT instruction,
// the derivation digest, and the payee verification state captured at calculation.
export function getPayoutAuthority(brand: PayoutBasisBrand) {
    const metadata = brand.metadata ?? {};
    return {
        netPayablePaise: brand.netPayablePaise,
        grossSalesPaise: brand.grossSalesPaise,
        commissionPaise: brand.commissionPaise,
        paymentFeePaise: brand.paymentFeePaise,
        returnsPaise: brand.returnsPaise,
        carrierClaimsPaise: brand.carrierClaimsPaise,
        holdbackPaise: brand.holdbackPaise,
        holdbackReleasePaise: brand.holdbackReleasePaise,
        overrideNetPaise: brand.overrideNetPaise,
        tdsPaise: brand.tdsPaise,
        payoutMethod: brand.payoutMethod,
        bankAccountNumber: (metadata.bankAccountNumber as string | null | undefined) ?? null,
        bankIfscCode: (metadata.bankIfscCode as string | null | undefined) ?? null,
        bankAccountHolderName:
            (metadata.bankAccountHolderName as string | null | undefined) ?? null,
        verificationStatus:
            (metadata.confidentialVerificationStatus as string | null | undefined) ?? null,
        referencesDigest: getContributingReferencesDigest(brand),
    };
}

export function computePayoutBasisFingerprint(
    cycleId: string,
    brands: PayoutBasisBrand[]
) {
    const canonical = [...brands]
        .sort((left, right) => left.brandId.localeCompare(right.brandId))
        .map((brand) => ({ brandId: brand.brandId, ...getPayoutAuthority(brand) }));
    return sha256(
        canonicalJson({ version: PAYOUT_BASIS_VERSION, cycleId, brands: canonical })
    );
}
