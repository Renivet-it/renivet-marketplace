import { env } from "@/../env";
import { BitFieldBrandPermission } from "@/config/permissions";
import { brandCache, userCache } from "@/lib/redis/methods";
import { resend } from "@/lib/resend";
import { BrandVerificationtSubmitted } from "@/lib/resend/emails";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import {
    createBrandConfidentialSchema,
    updateBrandConfidentialSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

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
                    confidentialVerificationStatus: "pending",
                }),
                brandCache.remove(id),
                userCache.remove(existingBrand.ownerId),
            ]);

            await resend.emails.send({
                from: env.RESEND_EMAIL_FROM,
                to: existingBrand.email,
                subject: `Verification Request - ${existingBrand.name}`,
                react: BrandVerificationtSubmitted({
                    user: {
                        name: existingBrand.name,
                    },
                    brand: {
                        id: existingBrand.id,
                        status: "pending",
                        name: existingBrand.name,
                    },
                }),
            });

            return data;
        }),
    updateConfidential: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                values: updateBrandConfidentialSchema,
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.ADMINISTRATOR, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id, values } = input;

            const existingBrandConfidential =
                await queries.brandConfidentials.getBrandConfidential(id);
            if (!existingBrandConfidential)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Confidential not found",
                });

            if (existingBrandConfidential.verificationStatus === "approved")
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Confidential already verified",
                });

            const [data] = await Promise.all([
                queries.brandConfidentials.updateBrandConfidential(id, values),
                queries.brandConfidentials.updateBrandConfidentialStatus(id, {
                    status: "pending",
                }),
                queries.brands.updateBrandConfidentialStatus({
                    id,
                    confidentialVerificationStatus: "pending",
                    confidentialVerificationRejectedAt: null,
                    confidentialVerificationRejectedReason: null,
                }),
                brandCache.remove(id),
                userCache.remove(existingBrandConfidential.brand.ownerId),
            ]);

            return data;
        }),
});
