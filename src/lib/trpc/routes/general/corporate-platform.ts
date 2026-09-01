import { BitFieldSitePermission } from "@/config/permissions";
import { corporateDocumentService } from "@/lib/services/corporate-documents";
import { corporatePlatformService } from "@/lib/services/corporate-platform";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { corporateOrderWorkflowStatusSchema } from "@/lib/validations/corporate-order";
import {
    corporateAdminBuyerProfileInputSchema,
    corporateAdminManualQuoteInputSchema,
    corporateAdminOfflinePaymentInputSchema,
    corporateAdminPaymentRequestInputSchema,
    corporateAdminPurchaseOrderInputSchema,
    corporateAdminQuoteDecisionInputSchema,
    corporateApprovedQuoteOrderInputSchema,
    corporateBrandInvoiceUploadInputSchema,
    corporateBrandTaxInvoiceInputSchema,
    corporateBrandTaxInvoiceReviewInputSchema,
    corporateCatalogListInputSchema,
    corporateDeliveryChallanInputSchema,
    corporateDocumentSettingsInputSchema,
    corporateForwardOrderInputSchema,
    corporateOrderProformaInvoiceInputSchema,
    corporatePaymentInputSchema,
    corporatePickupScheduleInputSchema,
    corporateProfileInputSchema,
    corporateProformaInvoiceInputSchema,
    corporatePurchaseOrderInputSchema,
    corporatePurchaseOrderReviewInputSchema,
    corporateQcSubmissionInputSchema,
    corporateQuoteDecisionInputSchema,
    corporateQuoteInputSchema,
    corporateQuoteRevisionInputSchema,
    corporateReplacementRequestInputSchema,
    corporateReplacementReviewInputSchema,
    corporateReportInputSchema,
    corporateRfqInputSchema,
    corporateShipmentInputSchema,
    corporateTaskInputSchema,
    corporateTaxInvoiceInputSchema,
    corporateUpdateConsigneeAddressInputSchema,
    corporateVendorPurchaseOrderInputSchema,
} from "@/lib/validations/corporate-platform";
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
    createManualQuote: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateAdminManualQuoteInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createManualQuote(
                ctx.user.id,
                input
            );
        }),
    addQuoteRevision: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateQuoteRevisionInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.addQuoteRevision(
                ctx.user.id,
                input
            );
        }),
    listMyQuotes: protectedProcedure.query(({ ctx }) => {
        return corporatePlatformService.listMyQuotes(ctx.user.id);
    }),
    listMyPurchaseOrders: protectedProcedure.query(({ ctx }) => {
        return corporatePlatformService.listMyPurchaseOrders(ctx.user.id);
    }),
    listMyReplacementRequests: protectedProcedure
        .input(
            z
                .object({
                    orderId: z.string().uuid().optional(),
                })
                .optional()
        )
        .query(({ ctx, input }) => {
            return corporatePlatformService.listMyReplacementRequests(
                ctx.user.id,
                input?.orderId
            );
        }),
    createReplacementRequest: protectedProcedure
        .input(corporateReplacementRequestInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createReplacementRequest(
                ctx.user.id,
                input
            );
        }),
    decideQuote: protectedProcedure
        .input(corporateQuoteDecisionInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.decideQuote(ctx.user.id, input);
        }),
    acceptQuoteAsAdmin: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateAdminQuoteDecisionInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.acceptQuoteAsAdmin(
                ctx.user.id,
                input
            );
        }),
    createPurchaseOrder: protectedProcedure
        .input(corporatePurchaseOrderInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createPurchaseOrder(
                ctx.user.id,
                input
            );
        }),
    createAdminPurchaseOrder: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateAdminPurchaseOrderInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createAdminPurchaseOrder(
                ctx.user.id,
                input
            );
        }),
    reviewPurchaseOrder: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporatePurchaseOrderReviewInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.reviewPurchaseOrder(
                ctx.user.id,
                input
            );
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
    updateConsigneeAddress: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateUpdateConsigneeAddressInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.updateConsigneeAddress(
                ctx.user.id,
                input
            );
        }),
    createForwardOrder: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateForwardOrderInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createForwardOrder(
                ctx.user.id,
                input
            );
        }),
    scheduleCorporatePickup: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporatePickupScheduleInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.scheduleCorporatePickup(
                ctx.user.id,
                input
            );
        }),
    listReplacementRequestsForOrder: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .input(
            z.object({
                orderId: z.string().uuid(),
            })
        )
        .query(({ input }) => {
            return corporatePlatformService.listReplacementRequestsForOrder(
                input.orderId
            );
        }),
    listAdminReplacementRequests: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .query(() => {
            return corporatePlatformService.listAdminReplacementRequests();
        }),
    reviewReplacementRequest: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateReplacementReviewInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.reviewReplacementRequest(
                ctx.user.id,
                input
            );
        }),
    recordPayment: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporatePaymentInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.recordPayment(ctx.user.id, input);
        }),
    createAdminPaymentRequest: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateAdminPaymentRequestInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createAdminPaymentRequest(
                ctx.user.id,
                input
            );
        }),
    recordAdminOfflinePayment: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateAdminOfflinePaymentInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.recordAdminOfflinePayment(
                ctx.user.id,
                input
            );
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
    issueOrderProformaInvoice: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateOrderProformaInvoiceInputSchema)
        .mutation(({ input }) => {
            return corporateDocumentService.ensureProformaInvoiceForOrder(
                input.orderId
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
    createAdminBuyerProfile: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateAdminBuyerProfileInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.createAdminBuyerProfile(
                ctx.user.id,
                input
            );
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
    getOrderDocumentChain: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .input(z.object({ orderId: z.string().uuid() }))
        .query(({ input }) => {
            return corporateDocumentService.getOrderDocumentChain(
                input.orderId
            );
        }),
    issueVendorPurchaseOrder: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateVendorPurchaseOrderInputSchema)
        .mutation(({ ctx, input }) => {
            return corporateDocumentService.issueVendorPurchaseOrder(
                ctx.user.id,
                input
            );
        }),
    recordBrandTaxInvoice: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateBrandTaxInvoiceInputSchema)
        .mutation(({ ctx, input }) => {
            return corporateDocumentService.recordBrandTaxInvoice(
                ctx.user.id,
                input
            );
        }),
    recordBrandAssignedTaxInvoice: protectedProcedure
        .input(
            z.object({
                brandId: z.string().uuid(),
                invoice: corporateBrandInvoiceUploadInputSchema,
            })
        )
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.recordBrandAssignedTaxInvoice(
                ctx.user.id,
                input.brandId,
                input.invoice
            );
        }),
    reviewBrandTaxInvoice: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateBrandTaxInvoiceReviewInputSchema)
        .mutation(({ input }) => {
            return corporateDocumentService.reviewBrandTaxInvoice(input);
        }),
    issueDeliveryChallan: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateDeliveryChallanInputSchema)
        .mutation(({ ctx, input }) => {
            return corporateDocumentService.issueDeliveryChallan(
                ctx.user.id,
                input
            );
        }),
    getCorporateDocumentSettings: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .query(() => corporateDocumentService.getSettings()),
    updateCorporateDocumentSettings: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .input(corporateDocumentSettingsInputSchema)
        .mutation(({ input }) => {
            return corporateDocumentService.updateSettings(input);
        }),
    updateBrandAssignedOrderStatus: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(
            z.object({
                brandId: z.string().uuid(),
                orderId: z.string().uuid(),
                toStatus: corporateOrderWorkflowStatusSchema,
                note: z.string().trim().max(1000).nullish(),
            })
        )
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.updateBrandAssignedOrderStatus(
                ctx.user.id,
                input.brandId,
                {
                    orderId: input.orderId,
                    toStatus: input.toStatus,
                    note: input.note,
                }
            );
        }),
    issueSettlementStatement: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(
            z.object({
                orderId: z.string().uuid(),
                commissionPercent: z.number().min(0).max(100),
                notes: z.string().trim().max(1000).nullish(),
            })
        )
        .mutation(({ ctx, input }) => {
            return corporateDocumentService.issueSettlementStatement(
                ctx.user.id,
                input
            );
        }),
    generateReport: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateReportInputSchema)
        .mutation(({ ctx, input }) => {
            return corporatePlatformService.generateReport(ctx.user.id, input);
        }),
});
