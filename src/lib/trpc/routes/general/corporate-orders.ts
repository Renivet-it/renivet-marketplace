import { BitFieldSitePermission } from "@/config/permissions";
import { corporateOrderService } from "@/lib/services/corporate-order";
import { corporatePaymentRequestService } from "@/lib/services/corporate-payment-request";
import {
    corporateBalancePaymentConfirmationInputSchema,
    corporateBalancePaymentOrderInputSchema,
    corporateConfigUpsertInputSchema,
    corporateOrderBrandAssignmentInputSchema,
    corporateOrderFormInputSchema,
    corporateOrderListInputSchema,
    corporateOrderWorkflowStatusSchema,
    corporatePaymentConfirmationInputSchema,
} from "@/lib/validations/corporate-order";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { z } from "zod";

export const corporateOrdersRouter = createTRPCRouter({
    getFormConfig: protectedProcedure.query(async () => {
        return corporateOrderService.getFormConfig();
    }),
    getQuote: protectedProcedure
        .input(corporateOrderFormInputSchema)
        .mutation(async ({ input }) => {
            return corporateOrderService.getQuote(input);
        }),
    createAdvancePaymentOrder: protectedProcedure
        .input(corporateOrderFormInputSchema)
        .mutation(async ({ ctx, input }) => {
            return corporateOrderService.createAdvancePaymentOrder(
                ctx.user.id,
                input
            );
        }),
    confirmAdvancePayment: protectedProcedure
        .input(corporatePaymentConfirmationInputSchema)
        .mutation(async ({ ctx, input }) => {
            return corporateOrderService.confirmAdvancePayment(ctx.user.id, input);
        }),
    createBalancePaymentOrder: protectedProcedure
        .input(corporateBalancePaymentOrderInputSchema)
        .mutation(async ({ ctx, input }) => {
            return corporateOrderService.createBalancePaymentOrder(
                ctx.user.id,
                input
            );
        }),
    confirmBalancePayment: protectedProcedure
        .input(corporateBalancePaymentConfirmationInputSchema)
        .mutation(async ({ ctx, input }) => {
            return corporateOrderService.confirmBalancePayment(ctx.user.id, input);
        }),
    createRequestedPaymentOrder: protectedProcedure
        .input(z.object({ paymentRequestId: z.string().uuid() }))
        .mutation(({ ctx, input }) => {
            return corporatePaymentRequestService.createAccountCheckout(
                ctx.user.id,
                input.paymentRequestId
            );
        }),
    confirmRequestedPayment: protectedProcedure
        .input(
            z.object({
                paymentRequestId: z.string().uuid(),
                razorpayOrderId: z.string().min(1),
                razorpayPaymentId: z.string().min(1),
                razorpaySignature: z.string().min(1),
            })
        )
        .mutation(({ ctx, input }) => {
            return corporatePaymentRequestService.confirmAccount(
                ctx.user.id,
                input.paymentRequestId,
                input
            );
        }),
    getOrderConfirmation: protectedProcedure
        .input(
            z.object({
                corporateOrderId: z.string().uuid(),
            })
        )
        .query(async ({ ctx, input }) => {
            return corporateOrderService.getOrderConfirmation(
                ctx.user.id,
                input.corporateOrderId
            );
        }),
    listMyOrders: protectedProcedure.query(async ({ ctx }) => {
        return corporateOrderService.listOrdersForUser(ctx.user.id);
    }),
    listOrders: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .input(corporateOrderListInputSchema)
        .query(async ({ input }) => {
            return corporateOrderService.listOrders(input);
        }),
    getOrderById: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_ORDERS))
        .input(
            z.object({
                corporateOrderId: z.string().uuid(),
            })
        )
        .query(async ({ input }) => {
            return corporateOrderService.getOrderById(input.corporateOrderId);
        }),
    assignBrand: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(corporateOrderBrandAssignmentInputSchema)
        .mutation(async ({ ctx, input }) => {
            return corporateOrderService.assignBrand(input, ctx.user.id);
        }),
    updateStatus: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(
            z.object({
                corporateOrderId: z.string().uuid(),
                toStatus: corporateOrderWorkflowStatusSchema,
                note: z.string().max(500).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return corporateOrderService.updateStatus({
                corporateOrderId: input.corporateOrderId,
                toStatus: input.toStatus,
                changedByUserId: ctx.user.id,
                note: input.note,
            });
        }),
    saveBalancePaymentLink: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(
            z.object({
                corporateOrderId: z.string().uuid(),
                balancePaymentLink: z.string().url(),
                balancePaymentNotes: z.string().max(1000).optional(),
            })
        )
        .mutation(async ({ input }) => {
            return corporateOrderService.saveBalancePaymentLink(input);
        }),
    sendBalancePaymentReminder: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_ORDERS))
        .input(
            z.object({
                corporateOrderId: z.string().uuid(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return corporateOrderService.sendBalancePaymentReminder({
                corporateOrderId: input.corporateOrderId,
                changedByUserId: ctx.user.id,
            });
        }),
    listConfig: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .query(async () => {
            return corporateOrderService.listConfig();
        }),
    upsertConfig: protectedProcedure
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .input(corporateConfigUpsertInputSchema)
        .mutation(async ({ input }) => {
            return corporateOrderService.upsertConfig(input);
        }),
});
