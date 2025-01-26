import { BitFieldSitePermission } from "@/config/permissions";
import { razorpay } from "@/lib/razorpay";
import { planCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { sanitizeHtml } from "@/lib/utils";
import { createPlanSchema, updatePlanStatusSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const plansRouter = createTRPCRouter({
    getPlans: protectedProcedure
        .input(
            z.object({
                isActive: z.boolean().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .query(async ({ input }) => {
            const plans = await planCache.getAll();

            const filtered = plans.filter((plan) => {
                if (input.isActive !== undefined)
                    return plan.isActive === input.isActive;

                return true;
            });

            return {
                data: filtered,
                count: filtered.length,
            };
        }),
    getActivePlans: publicProcedure.query(async () => {
        const plans = await planCache.getAll();
        const data = plans.filter((plan) => plan.isActive);
        return data;
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
                    currency: "INR",
                    description: input.description
                        ? sanitizeHtml(input.description)
                        : undefined,
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

            const existingActivePlan = await queries.plans.getPlan(id);
            if (!existingActivePlan)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Plan not found",
                });

            const [plan] = await Promise.all([
                queries.plans.updatePlanStatus({ id, isActive }),
                planCache.drop(),
            ]);
            return plan;
        }),
});
