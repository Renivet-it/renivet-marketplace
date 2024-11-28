import { BitFieldBrandPermission } from "@/config/permissions";
import { brandCache, userCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { getUserPermissions, hasPermission } from "@/lib/utils";
import {
    createdBannedBrandMemberSchema,
    updateMemberRolesSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

export const memberRolesRouter = createTRPCRouter({
    updateRoles: protectedProcedure
        .input(updateMemberRolesSchema)
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_TEAM, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { db, schemas, user } = ctx;
            const { userId, roleIds } = input;

            const existingBrandMember = await userCache.get(userId);
            if (!existingBrandMember)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Member not found",
                });
            if (!existingBrandMember.brand)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "User does not have a brand",
                });

            const existingBrand = await brandCache.get(
                existingBrandMember.brand.id
            );
            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            const existingRoles = existingBrand.roles.filter((role) =>
                roleIds.includes(role.id)
            );
            if (existingRoles.length !== roleIds.length)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Some roles do not exist",
                });

            const existingRoleIds = existingBrandMember.roles.map(
                (role) => role.id
            );
            const newRoles = existingRoles.filter(
                (role) => !existingRoleIds.includes(role.id)
            );
            const removedRoles = existingBrandMember.roles.filter(
                (role) => !roleIds.includes(role.id)
            );

            const { brandPermissions: existingRolesBrandPermissions } =
                getUserPermissions(existingBrandMember.roles);
            const hasExistingRolesAdminPerms = hasPermission(
                existingRolesBrandPermissions,
                [BitFieldBrandPermission.ADMINISTRATOR]
            );

            const { brandPermissions: newRolesBrandPermissions } =
                getUserPermissions(newRoles);
            const hasNewRolesAdminPerms = hasPermission(
                newRolesBrandPermissions,
                [BitFieldBrandPermission.ADMINISTRATOR]
            );

            if (
                user.id === userId &&
                hasNewRolesAdminPerms &&
                !hasExistingRolesAdminPerms
            )
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Cannot add admin roles",
                });

            const { brandPermissions: removedRolesBrandPermissions } =
                getUserPermissions(removedRoles);
            const hasRemovedRolesAdminPerms = hasPermission(
                removedRolesBrandPermissions,
                [BitFieldBrandPermission.ADMINISTRATOR]
            );

            if (user.id !== userId && hasRemovedRolesAdminPerms)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Cannot remove admin roles",
                });

            if (newRoles.length === 0 && removedRoles.length === 0)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No changes detected",
                });

            await Promise.all([
                db.transaction(async (tx) => {
                    if (newRoles.length > 0)
                        await tx.insert(schemas.userRoles).values(
                            newRoles.map((role) => ({
                                userId,
                                roleId: role.id,
                            }))
                        );

                    if (removedRoles.length > 0)
                        await tx.delete(schemas.userRoles).where(
                            and(
                                eq(schemas.userRoles.userId, userId),
                                inArray(
                                    schemas.userRoles.roleId,
                                    removedRoles.map((role) => role.id)
                                )
                            )
                        );
                }),
                userCache.remove(userId),
            ]);

            return true;
        }),
});

export const membersRouter = createTRPCRouter({
    roles: memberRolesRouter,
    getMembers: protectedProcedure
        .input(
            z.object({
                brandId: z.string(),
                limit: z.number().min(1).max(50).default(10),
                page: z.number().min(1).default(1),
                search: z.string().optional(),
            })
        )
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_TEAM, "all", "brand"))
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { brandId, limit, page, search } = input;

            const data = await queries.brandMembers.getBrandMembers({
                brandId,
                limit,
                page,
                search,
            });

            return data;
        }),
    kickMember: protectedProcedure
        .input(createdBannedBrandMemberSchema.omit({ reason: true }))
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_TEAM, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { db, schemas, user, queries } = ctx;
            const { memberId, brandId } = input;

            const [existingBrand, existingBrandMember] = await Promise.all([
                brandCache.get(brandId),
                queries.brandMembers.getBrandMemberByMemberId(memberId),
            ]);

            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            if (!existingBrandMember)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Member not found",
                });

            if (existingBrandMember.isOwner)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Cannot kick owner",
                });

            if (existingBrandMember.memberId === user.id)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Cannot kick self",
                });

            await Promise.all([
                queries.brandMembers.deleteBrandMember(brandId, memberId),
                db
                    .delete(schemas.userRoles)
                    .where(eq(schemas.userRoles.userId, memberId)),
                userCache.remove(memberId),
                brandCache.remove(brandId),
            ]);
        }),
    banMember: protectedProcedure
        .input(createdBannedBrandMemberSchema)
        .use(isTRPCAuth(BitFieldBrandPermission.MANAGE_TEAM, "all", "brand"))
        .mutation(async ({ input, ctx }) => {
            const { db, schemas, user, queries } = ctx;
            const { memberId, reason, brandId } = input;

            const [existingBrand, existingBrandMember] = await Promise.all([
                brandCache.get(brandId),
                queries.brandMembers.getBrandMemberByMemberId(memberId),
            ]);

            if (!existingBrand)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Brand not found",
                });

            if (!existingBrandMember)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Member not found",
                });

            if (existingBrandMember.isOwner)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Cannot ban owner",
                });

            if (existingBrandMember.memberId === user.id)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Cannot ban self",
                });

            await Promise.all([
                queries.brandMembers.deleteBrandMember(brandId, memberId),
                db
                    .delete(schemas.userRoles)
                    .where(eq(schemas.userRoles.userId, memberId)),
                queries.bannedBrandMembers.createBannedBrandMember({
                    memberId,
                    brandId,
                    reason,
                }),
                userCache.remove(memberId),
                brandCache.remove(brandId),
            ]);

            return true;
        }),
});
