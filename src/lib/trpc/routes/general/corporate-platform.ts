import { BitFieldSitePermission } from "@/config/permissions";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import {
    corporateCatalogListInputSchema,
    corporateApprovedQuoteOrderInputSchema,
    corporateProfileInputSchema,
    corporateReportInputSchema,
    corporatePurchaseOrderInputSchema,
    corporatePurchaseOrderReviewInputSchema,
    corporatePaymentInputSchema,
    corporateQcSubmissionInputSchema,
    corporateProformaInvoiceInputSchema,
    corporateQuoteDecisionInputSchema,
    corporateQuoteInputSchema,
    corporateQuoteRevisionInputSchema,
    corporateRfqInputSchema,
    corporateShipmentInputSchema,
    corporateTaskInputSchema,
    corporateTaxInvoiceInputSchema,
} from "@/lib/validations/corporate-platform";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { z } from "zod";

export const corporatePlatformRouter = createTRPCRouter({
    getMyProfile: protectedProcedure.query(({ ctx }) => {
        return corporatePlatformService.getMyProfile(ctx.user.id);
    }),
    upsertMyProfile: protectedProcedure
        .input(corporateProfileInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.upsertMyProfile(ctx.user.id, input);
        }),
    listCatalog: protectedProcedure
        .input(corporateCatalogListInputSchema.optional())
        .query(({ input }) => {
            return corporatePlatformService.listCatalog(input ?? {});
        }),
    seedCatalog: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(() => {
            return corporatePlatformService.seedCatalogFromExistingProducts();
        }),
    submitRfq: protectedProcedure
        .input(corporateRfqInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.submitRfq(ctx.user.id, input);
        }),
    listMyRfqs: protectedProcedure.query(({ ctx }) => {
        return corporatePlatformService.listMyRfqs(ctx.user.id);
    }),
    createQuote: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateQuoteInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createQuote(ctx.user.id, input);
        }),
    addQuoteRevision: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateQuoteRevisionInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.addQuoteRevision(ctx.user.id, input);
        }),
    listMyQuotes: protectedProcedure.query(({ ctx }) => {
        return corporatePlatformService.listMyQuotes(ctx.user.id);
    }),
    decideQuote: protectedProcedure
        .input(corporateQuoteDecisionInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.decideQuote(ctx.user.id, input);
        }),
    createPurchaseOrder: protectedProcedure
        .input(corporatePurchaseOrderInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createPurchaseOrder(ctx.user.id, input);
        }),
    reviewPurchaseOrder: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporatePurchaseOrderReviewInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.reviewPurchaseOrder(ctx.user.id, input);
        }),
    createOrderFromApprovedQuote: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateApprovedQuoteOrderInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createOrderFromApprovedQuote(
                ctx.user.id,
                input
            );
        }),
    createTask: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateTaskInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createTask(ctx.user.id, input);
        }),
    submitQc: protectedProcedure
        .input(corporateQcSubmissionInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.submitQc(ctx.user.id, input);
        }),
    saveShipment: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateShipmentInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.saveShipment(ctx.user.id, input);
        }),
    recordPayment: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporatePaymentInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.recordPayment(ctx.user.id, input);
        }),
    issueProformaInvoice: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateProformaInvoiceInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.issueProformaInvoice(
                ctx.user.id,
                input
            );
        }),
    issueTaxInvoice: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateTaxInvoiceInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.issueTaxInvoice(ctx.user.id, input);
        }),
    getAdminDashboardSummary: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .query(() => {
            return corporatePlatformService.getAdminDashboardSummary();
        }),
    listAdminRfqs: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .query(() => {
            return corporatePlatformService.listAdminRfqs();
        }),
    listAdminQuotes: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .query(() => {
            return corporatePlatformService.listAdminQuotes();
        }),
    listAdminTasks: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .query(() => {
            return corporatePlatformService.listAdminTasks();
        }),
    listAdminFinance: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .query(() => {
            return corporatePlatformService.listAdminFinance();
        }),
    listAdminBrandOptions: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .query(() => {
            return corporatePlatformService.listAdminBrandOptions();
        }),
    listAdminProfileOptions: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .query(() => {
            return corporatePlatformService.listAdminProfileOptions();
        }),
    listBrandAssignedOrders: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
            })
        )
        .query(({ ctx, input }) => {
            return corporatePlatformService.listBrandAssignedOrders(
                ctx.user.id,
                input.brandId
            );
        }),
    generateReport: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateReportInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.generateReport(ctx.user.id, input);
        }),
});
