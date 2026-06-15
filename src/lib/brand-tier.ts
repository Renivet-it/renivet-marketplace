import {
    BRAND_TIER_LABELS,
    BRAND_TIER_SETTINGS,
    BrandTier,
} from "@/config/brand-program";

export interface BrandTierMonthMetric {
    month: string;
    gmvPaise: number;
}

export interface BrandTierMetrics {
    monthlyGmv: BrandTierMonthMetric[];
    slaBreaches90d: number;
    qualityComplaints90d: number;
    hasExpiredSustainabilityCertificate: boolean;
    oldestActiveIssueAt: Date | null;
    lastIssueObservedAt: Date | null;
}

export interface BrandTierComputation {
    tier: BrandTier;
    baseTier: Exclude<BrandTier, "tier_0" | "offboarded">;
    reason: string;
    metrics: BrandTierMetrics;
    previousTierSnapshot: Exclude<BrandTier, "tier_0" | "offboarded"> | null;
}

const toDate = (value: Date | string | null | undefined) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const daysBetween = (from: Date | string, to: Date | string) => {
    const fromDate = toDate(from);
    const toDateValue = toDate(to);

    if (!fromDate || !toDateValue) return null;

    return Math.floor(
        (toDateValue.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    );
};

const hasReachedGmvThresholdBefore = (
    monthlyGmv: BrandTierMonthMetric[],
    threshold: number
) => monthlyGmv.some((month) => month.gmvPaise >= threshold);

const hasMeaningfulGmvHistory = (monthlyGmv: BrandTierMonthMetric[]) =>
    monthlyGmv.some((month) => month.gmvPaise > 0);

const getBaseTierFromGmv = (
    monthlyGmv: BrandTierMonthMetric[]
): Exclude<BrandTier, "tier_0" | "offboarded"> => {
    const threshold = BRAND_TIER_SETTINGS.monthlyGmvThresholdPaise;
    const recentTwo = monthlyGmv.slice(-2);
    const recentFour = monthlyGmv.slice(-4);
    const hasHistory = hasMeaningfulGmvHistory(monthlyGmv);
    const hasPriorTierOneRun = hasReachedGmvThresholdBefore(
        monthlyGmv,
        threshold
    );

    if (!hasHistory || !hasPriorTierOneRun) {
        return "tier_1";
    }

    const hasThreeConsecutiveHalfDrops =
        recentFour.length === 4 &&
        recentFour[0].gmvPaise > 0 &&
        recentFour[1].gmvPaise > 0 &&
        recentFour[2].gmvPaise > 0 &&
        recentFour[1].gmvPaise <= recentFour[0].gmvPaise * 0.5 &&
        recentFour[2].gmvPaise <= recentFour[1].gmvPaise * 0.5 &&
        recentFour[3].gmvPaise <= recentFour[2].gmvPaise * 0.5;

    if (hasThreeConsecutiveHalfDrops) {
        return "tier_3";
    }

    const belowThresholdForTwoMonths =
        recentTwo.length === 2 &&
        hasPriorTierOneRun &&
        recentTwo.every((month) => month.gmvPaise < threshold);

    if (belowThresholdForTwoMonths) {
        return "tier_2";
    }

    return "tier_1";
};

export function computeBrandTier(
    metrics: BrandTierMetrics,
    previousTierSnapshot: Exclude<BrandTier, "tier_0" | "offboarded"> | null
): BrandTierComputation {
    const now = new Date();
    const baseTier = getBaseTierFromGmv(metrics.monthlyGmv);
    const hasHistory = hasMeaningfulGmvHistory(metrics.monthlyGmv);
    const hasPriorTierOneRun = hasReachedGmvThresholdBefore(
        metrics.monthlyGmv,
        BRAND_TIER_SETTINGS.monthlyGmvThresholdPaise
    );
    const rememberedPreviousTier = previousTierSnapshot ?? baseTier;

    const hasSlaTrigger =
        metrics.slaBreaches90d >= BRAND_TIER_SETTINGS.slaBreachThreshold;
    const hasQualityTrigger =
        metrics.qualityComplaints90d >
        BRAND_TIER_SETTINGS.qualityComplaintThreshold;
    const hasCertificateTrigger = metrics.hasExpiredSustainabilityCertificate;
    const hasIssueTrigger =
        hasSlaTrigger || hasQualityTrigger || hasCertificateTrigger;

    if (metrics.oldestActiveIssueAt) {
        const ageInDays = daysBetween(metrics.oldestActiveIssueAt, now);

        if (
            ageInDays !== null &&
            ageInDays >= BRAND_TIER_SETTINGS.offboardWindowDays
        ) {
            return {
                tier: "offboarded",
                baseTier,
                reason:
                    "Tier 0 issues remained unresolved for 60+ days, so the brand is offboarded",
                metrics,
                previousTierSnapshot: rememberedPreviousTier,
            };
        }
    }

    if (!hasIssueTrigger && metrics.lastIssueObservedAt && previousTierSnapshot) {
        const daysSinceLastIssue = daysBetween(metrics.lastIssueObservedAt, now);

        if (
            daysSinceLastIssue !== null &&
            daysSinceLastIssue < BRAND_TIER_SETTINGS.cleanWindowDays
        ) {
            return {
                tier: "tier_0",
                baseTier,
                reason:
                    "Recent SLA, quality, or certificate issues still fall within the 30-day clean period",
                metrics,
                previousTierSnapshot: rememberedPreviousTier,
            };
        }

        return {
            tier: rememberedPreviousTier,
            baseTier,
            reason: `All Tier 0 issues were resolved and the brand stayed clean for 30 days, so it returned to ${BRAND_TIER_LABELS[rememberedPreviousTier]}`,
            metrics,
            previousTierSnapshot: null,
        };
    }

    if (!hasIssueTrigger) {
        return {
            tier: baseTier,
            baseTier,
            reason:
                baseTier === "tier_1"
                    ? !hasHistory || !hasPriorTierOneRun
                      ? "Brands start in Tier 1 by default and stay there until the downgrade rules are actually triggered"
                      : `GMV is at or above the active threshold (${BRAND_TIER_LABELS.tier_1})`
                    : baseTier === "tier_2"
                      ? "GMV stayed below the threshold for 2 consecutive months"
                      : "Sales dropped by 50%+ for 3 consecutive months",
            metrics,
            previousTierSnapshot: null,
        };
    }

    return {
        tier: "tier_0",
        baseTier,
        reason:
            "Brand hit Tier 0 due to SLA breaches, quality complaints, or an expired sustainability certificate",
        metrics,
        previousTierSnapshot: rememberedPreviousTier,
    };
}
