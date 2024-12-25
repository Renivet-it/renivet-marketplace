import { BitFieldSitePermission } from "@/config/permissions";
import { razorpay } from "@/lib/razorpay";
import { planCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { createPlanSchema, updatePlanStatusSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const plansRouter = createTRPCRouter({
    getPlans: protectedProcedure
        .input(
            z.object({
                isDeleted: z.boolean().optional(),
                isActive: z.boolean().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .query(async ({ input }) => {
            const plans = await planCache.getAll();

            const filtered = plans.filter((plan) => {
                if (input.isDeleted !== undefined)
                    return plan.isDeleted === input.isDeleted;
                if (input.isActive !== undefined)
                    return plan.isActive === input.isActive;

                return true;
            });

            return {
                data: filtered,
                count: filtered.length,
            };
        }),
    getActivePlan: publicProcedure.query(async () => {
        const plans = await planCache.getAll();
        const activePlan = plans.find((plan) => plan.isActive);

        return activePlan;
    }),
    getPlan: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .query(async ({ input }) => {
            const { id } = input;

            const plan = await planCache.get(id);
            if (!plan)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Plan not found",
                });

            return plan;
        }),
    createPlan: protectedProcedure
        .input(createPlanSchema.omit({ id: true }))
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;

            const rzpPlan = await razorpay.plans.create({
                interval: input.interval,
                item: {
                    amount: input.amount,
                    name: input.name,
                    currency: input.currency,
                    description: input.description ?? undefined,
                },
                period: input.period,
            });

            const newPlan = await queries.plans.createPlan({
                id: rzpPlan.id,
                ...input,
            });

            return newPlan;
        }),
    updatePlanStatus: protectedProcedure
        .input(updatePlanStatusSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, isActive } = input;

            const existingActivePlan = await queries.plans.getActivePlan();
            if (id === existingActivePlan?.id && !isActive)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot deactivate the active plan",
                });

            const [plan] = await Promise.all([
                queries.plans.updatePlanStatus({ id, isActive }),
                queries.plans.deactiveOtherPlans(id),
                planCache.drop(),
            ]);
            return plan;
        }),
    deletePlan: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingPlan = await planCache.get(id);
            if (!existingPlan)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Plan not found",
                });

            await Promise.all([
                queries.plans.deletePlan(id),
                planCache.remove(id),
            ]);

            return true;
        }),
});
