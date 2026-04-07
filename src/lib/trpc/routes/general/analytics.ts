import { BitFieldSitePermission } from "@/config/permissions";
import {
    ANALYTICS_COMPARISONS,
    ANALYTICS_DATE_PRESETS,
    FREEFORM_DIMENSIONS,
    FREEFORM_METRICS,
    getAdminOverviewMetrics,
    getAdminSalesBreakdown,
    getAdminSalesTimeSeries,
    runAdminFreeformReport,
} from "@/lib/reports/admin-analytics";
import {
    getAdminBehaviorOverview,
    getAdminBehaviorTimeSeries,
    getAdminLandingPagePerformance,
    getAdminReportLibrary,
    getAdminSessionsByLocation,
    saveAdminReport,
    updateAdminReport,
    deleteAdminReport,
    refreshSnapshots,
    REPORT_CATEGORIES,
    REPORT_VISUALIZATIONS,
} from "@/lib/reports/admin-analytics-advanced";
import { createTRPCRouter, isTRPCAuth, protectedProcedure } from "@/lib/trpc/trpc";
import { z } from "zod";

const ANALYTICS_READ_PERMISSION =
    BitFieldSitePermission.VIEW_ANALYTICS |
    BitFieldSitePermission.VIEW_ORDERS;

const baseDateInputSchema = z.object({
    datePreset: z.enum(ANALYTICS_DATE_PRESETS).default("30d"),
    comparison: z.enum(ANALYTICS_COMPARISONS).default("previous_period"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

const dateInputSchema = baseDateInputSchema.superRefine((val, ctx) => {
    if (val.datePreset !== "custom") return;

    if (!val.startDate || !val.endDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "startDate and endDate are required for custom date ranges",
        });
    }
});

const dateWithLimitInputSchema = baseDateInputSchema
    .extend({
        limit: z.number().int().min(1).max(100).default(20),
    })
    .superRefine((val, ctx) => {
        if (val.datePreset !== "custom") return;

        if (!val.startDate || !val.endDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "startDate and endDate are required for custom date ranges",
            });
        }
    });

const notFulfilledOrdersInputSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
    limit: z.number().int().min(1).max(200).default(50),
});

const freeformInputSchema = baseDateInputSchema
    .extend({
        metrics: z.array(z.enum(FREEFORM_METRICS)).min(1),
        dimension: z.enum(FREEFORM_DIMENSIONS),
        limit: z.number().int().min(1).max(200).default(20),
        offset: z.number().int().min(0).default(0),
        sortBy: z.union([z.enum(FREEFORM_METRICS), z.literal("dimension")]).optional(),
        sortDirection: z.enum(["asc", "desc"]).default("desc"),
    })
    .superRefine((val, ctx) => {
        if (val.datePreset !== "custom") return;

        if (!val.startDate || !val.endDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "startDate and endDate are required for custom date ranges",
            });
        }
    });

export const adminAnalyticsRouter = createTRPCRouter({
    getOverview: protectedProcedure
        .input(dateInputSchema)
        .use(isTRPCAuth(ANALYTICS_READ_PERMISSION, "any", "site"))
        .query(async ({ input }) => getAdminOverviewMetrics(input)),

    getBehaviorOverview: protectedProcedure
        .input(dateInputSchema)
        .use(isTRPCAuth(ANALYTICS_READ_PERMISSION, "any", "site"))
        .query(async ({ input }) => getAdminBehaviorOverview(input)),

    getBehaviorTimeSeries: protectedProcedure
        .input(dateInputSchema)
        .use(isTRPCAuth(ANALYTICS_READ_PERMISSION, "any", "site"))
        .query(async ({ input }) => getAdminBehaviorTimeSeries(input)),

    getLandingPagePerformance: protectedProcedure
        .input(dateWithLimitInputSchema)
        .use(isTRPCAuth(ANALYTICS_READ_PERMISSION, "any", "site"))
        .query(async ({ input }) =>
            getAdminLandingPagePerformance(input, input.limit)
        ),

    getSessionsByLocation: protectedProcedure
        .input(dateWithLimitInputSchema)
        .use(isTRPCAuth(ANALYTICS_READ_PERMISSION, "any", "site"))
        .query(async ({ input }) => getAdminSessionsByLocation(input, input.limit)),

    getSalesTimeSeries: protectedProcedure
        .input(dateInputSchema)
        .use(isTRPCAuth(ANALYTICS_READ_PERMISSION, "any", "site"))
        .query(async ({ input }) => getAdminSalesTimeSeries(input)),

    getSalesBreakdown: protectedProcedure
        .input(dateInputSchema)
        .use(isTRPCAuth(ANALYTICS_READ_PERMISSION, "any", "site"))
        .query(async ({ input }) => getAdminSalesBreakdown(input)),

    getReportLibrary: protectedProcedure
        .use(isTRPCAuth(ANALYTICS_READ_PERMISSION, "any", "site"))
        .query(async ({ ctx }) => getAdminReportLibrary(ctx.user.id)),

    getNotFulfilledOrders: protectedProcedure
        .input(notFulfilledOrdersInputSchema)
        .use(isTRPCAuth(ANALYTICS_READ_PERMISSION, "any", "site"))
        .query(async ({ input, ctx }) =>
            ctx.queries.orders.getOrders({
                page: 1,
                limit: input.limit,
                startDate: input.startDate,
                endDate: input.endDate,
                statusTab: "not_fulfilled",
            })
        ),

    saveReport: protectedProcedure
        .input(
            z.object({
                name: z.string().min(3).max(120),
                category: z.enum(REPORT_CATEGORIES),
                metrics: z.array(z.enum(FREEFORM_METRICS)).min(1),
                dimensions: z.array(z.enum(FREEFORM_DIMENSIONS)).min(1),
                filtersJson: z.record(z.unknown()).default({}),
                visualizationType: z.enum(REPORT_VISUALIZATIONS),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS, "any", "site"))
        .mutation(async ({ input, ctx }) => saveAdminReport(input, ctx.user.id)),

    updateReport: protectedProcedure
        .input(
            z.object({
                id: z.string().uuid(),
                name: z.string().min(3).max(120),
                category: z.enum(REPORT_CATEGORIES),
                metrics: z.array(z.enum(FREEFORM_METRICS)).min(1),
                dimensions: z.array(z.enum(FREEFORM_DIMENSIONS)).min(1),
                filtersJson: z.record(z.unknown()).default({}),
                visualizationType: z.enum(REPORT_VISUALIZATIONS),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS, "any", "site"))
        .mutation(async ({ input, ctx }) => updateAdminReport(input, ctx.user.id)),

    deleteReport: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS, "any", "site"))
        .mutation(async ({ input, ctx }) => deleteAdminReport(input.id, ctx.user.id)),

    runFreeformReport: protectedProcedure
        .input(freeformInputSchema)
        .use(isTRPCAuth(ANALYTICS_READ_PERMISSION, "any", "site"))
        .query(async ({ input }) => runAdminFreeformReport(input)),

    refreshSnapshots: protectedProcedure
        .input(
            z.object({
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                timezone: z.string().default("Asia/Kolkata"),
                currency: z.string().default("INR"),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS, "any", "site"))
        .mutation(async ({ input }) => refreshSnapshots(input)),
});
