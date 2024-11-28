import { BitFieldBrandPermission } from "@/config/permissions";
import { brandCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { createBrandInviteSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const invitesRouter = createTRPCRouter({
    getInvites: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { brandId } = input;
            const { queries } = ctx;

            const existingInvites =
                await queries.brandInvites.getBrandInvites(brandId);
            if (!existingInvites)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            return existingInvites;
        }),
    getInvite: protectedProcedure
        .input(
            z.object({
                code: z.string(),
            })
        )
        .query(async ({ input, ctx }) => {
            const { code } = input;
            const { queries } = ctx;

            const existingInvite =
                await queries.brandInvites.getBrandInvite(code);
            if (!existingInvite)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Invite not found",
                });

            return existingInvite;
        }),
    createInvite: protectedProcedure
        .input(createBrandInviteSchema)
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_INVITES, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { brandId, ...values } = input;
            const { queries } = ctx;

            const [newInvite] = await Promise.all([
                queries.brandInvites.createBrandInvite(brandId, values),
                brandCache.remove(brandId),
            ]);

            return newInvite;
        }),
    deleteInvite: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
                inviteId: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_INVITES, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { brandId, inviteId } = input;
            const { queries } = ctx;

            const [deletedInvite] = await Promise.all([
                queries.brandInvites.deleteBrandInvite(brandId, inviteId),
                brandCache.remove(brandId),
            ]);

            return deletedInvite;
        }),
});
