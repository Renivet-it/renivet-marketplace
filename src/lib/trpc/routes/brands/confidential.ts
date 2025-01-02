import { BitFieldBrandPermission } from "@/config/permissions";
import { brandCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { createBrandConfidentialSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";

export const confidentialsRouter = createTRPCRouter({
    createConfidential: protectedProcedure
        .input(createBrandConfidentialSchema)
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingBrand = await brandCache.get(id);
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const existingBrandConfidential =
                await queries.brandConfidentials.getBrandConfidential(id);
            if (existingBrandConfidential)
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Confidential already exists",
                });

            const [data] = await Promise.all([
                queries.brandConfidentials.createBrandConfidential(input),
                queries.brands.updateBrandConfidentialStatus({
                    id,
                    isConfidentialSentForVerification: true,
                }),
            ]);

            return data;
        }),
});
