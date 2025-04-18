import { BitFieldSitePermission } from "@/config/permissions";
import { legalCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { createLegalSchema } from "@/lib/validations";

export const legalRouter = createTRPCRouter({
    getLegal: publicProcedure.query(async () => {
        const legal = await legalCache.get();
        return legal;
    }),
    updateLegal: protectedProcedure
        .input(createLegalSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_SETTINGS))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const {
                termsOfService,
                privacyPolicy,
                refundPolicy,
                shippingPolicy,
            } = input;

            const existingLegal = await queries.legal.getLegal();
            if (existingLegal) {
                const updated =
                    privacyPolicy !== existingLegal.privacyPolicy &&
                    termsOfService !== existingLegal.termsOfService
                        ? "all"
                        : privacyPolicy !== existingLegal.privacyPolicy
                          ? "privacyPolicy"
                          : termsOfService !== existingLegal.termsOfService
                            ? "termsOfService"
                            : refundPolicy !== existingLegal.refundPolicy
                              ? "refundPolicy"
                              : shippingPolicy !== existingLegal.shippingPolicy
                                ? "shippingPolicy"
                                : null;

                await queries.legal.updateLegal({
                    termsOfService,
                    privacyPolicy,
                    refundPolicy,
                    shippingPolicy,
                    updated,
                });
            } else
                await queries.legal.createLegal({
                    termsOfService,
                    privacyPolicy,
                    refundPolicy,
                    shippingPolicy,
                });

            await legalCache.remove();
            return true;
        }),
});
