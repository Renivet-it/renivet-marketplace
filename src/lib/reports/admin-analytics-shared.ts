export const ANALYTICS_DATE_PRESETS = [
    "7d",
    "30d",
    "90d",
    "ytd",
    "custom",
] as const;

export const ANALYTICS_COMPARISONS = [
    "none",
    "previous_period",
    "previous_year",
] as const;

export const FREEFORM_DIMENSIONS = [
    "product_title",
    "product_vendor",
    "product_type",
    "order_status",
    "order_date",
] as const;

export const FREEFORM_METRICS = [
    "gross_sales",
    "discounts",
    "returns",
    "net_sales",
    "taxes",
    "shipping",
    "total_sales",
    "orders",
    "units_sold",
] as const;

export type AnalyticsDatePreset = (typeof ANALYTICS_DATE_PRESETS)[number];
export type AnalyticsComparison = (typeof ANALYTICS_COMPARISONS)[number];
export type FreeformDimension = (typeof FREEFORM_DIMENSIONS)[number];
export type FreeformMetric = (typeof FREEFORM_METRICS)[number];

export interface AnalyticsDateInput {
    datePreset: AnalyticsDatePreset;
    comparison: AnalyticsComparison;
    startDate?: string;
    endDate?: string;
}
