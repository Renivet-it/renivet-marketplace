export const BRAND_SUSTAINABILITY_CERTIFICATES = [
    {
        key: "gots",
        label: "GOTS",
        verificationUrl: "https://global-standard.org/find-suppliers",
    },
    {
        key: "oeko_tex",
        label: "OEKO-TEX",
        verificationUrl: "https://www.oeko-tex.com/en/buying-guide",
    },
    {
        key: "fsc",
        label: "FSC",
        verificationUrl: "https://info.fsc.org",
    },
    {
        key: "fair_trade_certified",
        label: "Fair Trade Certified",
        verificationUrl:
            "https://www.fairtradecertified.org/business/find-certified-products",
    },
    {
        key: "peta_beauty_without_bunnies",
        label: "PETA Beauty Without Bunnies",
        verificationUrl: "https://crueltyfree.peta.org",
    },
    {
        key: "bluesign",
        label: "Bluesign",
        verificationUrl: "https://www.bluesign.com/en/business/brands",
    },
    {
        key: "cradle_to_cradle",
        label: "Cradle to Cradle",
        verificationUrl: "https://c2ccertified.org/products/registry",
    },
    {
        key: "india_organic",
        label: "India Organic",
        verificationUrl: "https://apeda.gov.in",
    },
    {
        key: "khadi_mark",
        label: "Khadi Mark",
        verificationUrl: "https://www.kvic.gov.in",
    },
] as const;

export const BRAND_TIER_VALUES = [
    "tier_1",
    "tier_2",
    "tier_3",
    "tier_0",
    "offboarded",
] as const;

export const BRAND_TIER_LABELS: Record<(typeof BRAND_TIER_VALUES)[number], string> = {
    tier_1: "Tier 1",
    tier_2: "Tier 2",
    tier_3: "Tier 3",
    tier_0: "Tier 0",
    offboarded: "Offboarded",
};

export const BRAND_TIER_SETTINGS = {
    monthlyGmvThresholdPaise: 10_000_000,
    issueWindowDays: 90,
    cleanWindowDays: 30,
    offboardWindowDays: 60,
    slaBreachThreshold: 3,
    qualityComplaintThreshold: 2,
} as const;

export type BrandSustainabilityCertificateKey =
    (typeof BRAND_SUSTAINABILITY_CERTIFICATES)[number]["key"];

export type BrandTier = (typeof BRAND_TIER_VALUES)[number];
