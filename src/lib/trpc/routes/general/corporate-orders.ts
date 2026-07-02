import { BitFieldSitePermission } from "@/config/permissions";
import { corporateOrderService } from "@/lib/services/corporate-order";
import {
    corporateBalancePaymentConfirmationInputSchema,
    corporateBalancePaymentOrderInputSchema,
    corporateConfigUpsertInputSchema,
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
