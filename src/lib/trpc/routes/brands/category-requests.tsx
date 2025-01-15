import { BitFieldBrandPermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { createCategoryRequestSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";

export const categoryRequestsRouter = createTRPCRouter({
    createCategoryRequest: protectedProcedure
        .input(createCategoryRequestSchema)
        .use(
            isTRPCAuth(BitFieldBrandPermission.MANAGE_PRODUCTS, "all", "brand")
        )
        .mutation(async ({ input, ctx }) => {
            const { queries, user } = ctx;
            const { brandId } = input;

            if (user.brand?.id !== brandId)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have permission to do this",
                });

            const data = await queries.categoryRequests.createCategoryRequest({
                ...input,
                userId: user.id,
            });

            return data;
        }),
});
