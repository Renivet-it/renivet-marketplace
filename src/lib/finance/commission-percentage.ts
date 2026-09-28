export type MarketplaceCommissionPercentage = {
    configured: boolean;
    label: string;
    commissionPercentBps: number | null;
};

export function formatCommissionPercentageFromBps(
    commissionPercentBps: number
): string {
    if (
        !Number.isInteger(commissionPercentBps) ||
        commissionPercentBps < 0 ||
        commissionPercentBps > 10_000
    ) {
        throw new Error("Invalid marketplace commission rate");
    }

    return `${(commissionPercentBps / 100).toFixed(2)}%`;
}

export const formatMarketplaceCommissionPercentage =
    formatCommissionPercentageFromBps;

export function resolveMarketplaceCommissionPercentage(
    commissionPercentBps: number | null | undefined
): MarketplaceCommissionPercentage {
    if (commissionPercentBps == null) {
        return {
            configured: false,
            label: "Unconfigured",
            commissionPercentBps: null,
        };
    }

    return {
        configured: true,
        label: formatCommissionPercentageFromBps(commissionPercentBps),
        commissionPercentBps,
    };
}
