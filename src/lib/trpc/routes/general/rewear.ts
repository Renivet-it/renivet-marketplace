import { BitFieldSitePermission } from "@/config/permissions";
import {
    createRewearPickupRequestSchema,
} from "@/lib/validations";
import { z } from "zod";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "../../trpc";

export const rewearRouter = createTRPCRouter({
    createPickupRequest: publicProcedure
        .input(createRewearPickupRequestSchema)
        .mutation(async ({ ctx, input }) => {
            return ctx.queries.rewearPickupRequests.create(input);
        }),
    listPickupRequests: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().max(100).default(25),
                page: z.number().int().positive().default(1),
                search: z.string().trim().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.VIEW_FEEDBACK))
        .query(({ ctx, input }) =>
            ctx.queries.rewearPickupRequests.list(input)
        ),
});
