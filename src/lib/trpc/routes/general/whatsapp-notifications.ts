import { BitFieldSitePermission } from "@/config/permissions";
import { monitoringSlaQueries } from "@/lib/db/queries";
import { createTRPCRouter, isTRPCAuth, protectedProcedure } from "@/lib/trpc/trpc";
import { updateWhatsappNotificationModuleSchema } from "@/lib/validations";

export const whatsappNotificationsRouter = createTRPCRouter({
    getSettings: protectedProcedure
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_SETTINGS |
                    BitFieldSitePermission.MANAGE_SETTINGS,
                "any"
            )
        )
        .query(async () => {
            return monitoringSlaQueries.getWhatsappNotificationSettings();
        }),
    updateModule: protectedProcedure
        .input(updateWhatsappNotificationModuleSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            return monitoringSlaQueries.updateWhatsappNotificationModule({
                module: input.module,
                settings: input.settings,
                actorId: ctx.user.id,
            });
        }),
});
