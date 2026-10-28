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
import { buildRewearPickupAdminNotification } from "@/lib/rewear/notifications";
import { notifyAdmins } from "@/lib/support/utils";

export const rewearRouter = createTRPCRouter({
    createPickupRequest: publicProcedure
        .input(createRewearPickupRequestSchema)
        .mutation(async ({ ctx, input }) => {
            const request = await ctx.queries.rewearPickupRequests.create(input);

            const notification = buildRewearPickupAdminNotification(request);
            const [delivery] = await Promise.allSettled([
                notifyAdmins({
                    ...notification,
                }),
            ]);

            if (delivery.status === "rejected") {
                console.error(
                    "Failed to notify admins about a ReWear pickup request:",
                    delivery.reason
                );
            }

            return request;
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
