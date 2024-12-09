import { BitFieldSitePermission } from "@/config/permissions";
import { userCache } from "@/lib/redis/methods";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
} from "@/lib/trpc/trpc";
import { getUserPermissions, hasPermission, slugify } from "@/lib/utils";
import {
    createAddressSchema,
    updateAddressSchema,
    updateUserRolesSchema,
} from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { cartRouter } from "./cart";
import { wishlistRouter } from "./wishlist";

export const userAddressesRouter = createTRPCRouter({
    addAddress: protectedProcedure
        .input(createAddressSchema)
        .mutation(async ({ ctx, input }) => {
            const { db, schemas, user } = ctx;

            const slug = slugify(input.alias);

            const existingAddress = await db.query.addresses.findFirst({
                where: and(
                    eq(schemas.addresses.userId, user.id),
                    eq(schemas.addresses.type, input.type),
                    eq(schemas.addresses.aliasSlug, slug)
                ),
            });
            if (existingAddress)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Another address of this type with this alias exists",
                });

            const existingPrimaryAddress = user.addresses.find(
                (address) => address.isPrimary
            );

            const newAddress = await db.transaction(async (tx) => {
                if (input.isPrimary && existingPrimaryAddress)
                    await tx
                        .update(schemas.addresses)
                        .set({
                            isPrimary: false,
                        })
                        .where(
                            and(
                                eq(schemas.addresses.userId, user.id),
                                eq(
                                    schemas.addresses.id,
                                    existingPrimaryAddress.id
                                )
                            )
                        );

                const [address] = await Promise.all([
                    tx
                        .insert(schemas.addresses)
                        .values({
                            ...input,
                            aliasSlug: slug,
                            userId: user.id,
                        })
                        .returning()
                        .then((res) => res[0]),
                    userCache.remove(user.id),
                ]);

                return address;
            });

            return newAddress;
        }),
    updateAddress: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: updateAddressSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db, schemas, user } = ctx;
            const { id, data } = input;

            if (!data.isPrimary && user.addresses.length === 1)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User must have at least one primary address",
                });

            const existingAddress = await db.query.addresses.findFirst({
                where: and(
                    eq(schemas.addresses.userId, user.id),
                    eq(schemas.addresses.id, input.id)
                ),
            });
            if (!existingAddress)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Address not found",
                });

            const slug = slugify(data.alias);

            const existingAddressWithSameAlias =
                await db.query.addresses.findFirst({
                    where: and(
                        eq(schemas.addresses.userId, user.id),
                        eq(schemas.addresses.type, data.type),
                        eq(schemas.addresses.aliasSlug, slug),
                        ne(schemas.addresses.id, id)
                    ),
                });
            if (existingAddressWithSameAlias)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Another address of this type with this alias exists",
                });

            const existingPrimaryAddress = user.addresses.find(
                (address) => address.isPrimary
            );

            const updatedAddress = await db.transaction(async (tx) => {
                if (data.isPrimary && existingPrimaryAddress)
                    await tx
                        .update(schemas.addresses)
                        .set({
                            isPrimary: false,
                        })
                        .where(
                            and(
                                eq(schemas.addresses.userId, user.id),
                                eq(
                                    schemas.addresses.id,
                                    existingPrimaryAddress.id
                                )
                            )
                        );

                const [address] = await Promise.all([
                    tx
                        .update(schemas.addresses)
                        .set({
                            ...data,
                            aliasSlug: slug,
                        })
                        .where(
                            and(
                                eq(schemas.addresses.userId, user.id),
                                eq(schemas.addresses.id, id)
                            )
                        )
                        .returning()
                        .then((res) => res[0]),
                    userCache.remove(user.id),
                ]);

                return address;
            });

            return updatedAddress;
        }),
    deleteAddress: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { db, schemas, user } = ctx;
            const { id } = input;

            if (user.addresses.length === 1)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User must have at least one address",
                });

            const existingAddress = await db.query.addresses.findFirst({
                where: and(
                    eq(schemas.addresses.userId, user.id),
                    eq(schemas.addresses.id, id)
                ),
            });
            if (!existingAddress)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Address not found",
                });

            const existingPrimaryAddress = user.addresses.find(
                (address) => address.isPrimary
            );
            if (!existingPrimaryAddress)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User must have at least one primary address",
                });

            if (existingPrimaryAddress.id === id)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Primary address cannot be deleted",
                });

            await Promise.all([
                db
                    .delete(schemas.addresses)
                    .where(
                        and(
                            eq(schemas.addresses.userId, user.id),
                            eq(schemas.addresses.id, id)
                        )
                    ),
                userCache.remove(user.id),
            ]);

            return true;
        }),
});

export const userRolesRouter = createTRPCRouter({
    updateRoles: protectedProcedure
        .input(updateUserRolesSchema)
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_USERS))
        .mutation(async ({ ctx, input }) => {
            const { db, schemas, user } = ctx;
            const { userId, roleIds } = input;

            const [existingUser, existingRoles] = await Promise.all([
                userCache.get(userId),
                db.query.roles.findMany({
                    where: inArray(schemas.roles.id, roleIds),
                    columns: {
                        createdAt: false,
                        updatedAt: false,
                    },
                }),
            ]);
            if (!existingUser)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            if (existingRoles.length !== roleIds.length)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Some roles not found",
                });

            const existingRoleIds = existingUser.roles.map((role) => role.id);
            const newRoles = existingRoles.filter(
                (role) => !existingRoleIds.includes(role.id)
            );
            const removedRoles = existingUser.roles.filter(
                (role) => !roleIds.includes(role.id)
            );

            const { sitePermissions: existingRolesSitePermissions } =
                getUserPermissions(existingUser.roles);
            const hasExistingRolesAdminPerms = hasPermission(
                existingRolesSitePermissions,
                [BitFieldSitePermission.ADMINISTRATOR]
            );

            const { sitePermissions: newRolesSitePermissions } =
                getUserPermissions(newRoles);
            const hasNewRolesAdminPerms = hasPermission(
                newRolesSitePermissions,
                [BitFieldSitePermission.ADMINISTRATOR]
            );

            if (
                user.id === userId &&
                hasNewRolesAdminPerms &&
                !hasExistingRolesAdminPerms
            )
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot add admin roles",
                });

            const { sitePermissions: removedRolesSitePermissions } =
                getUserPermissions(removedRoles);
            const hasRemovedRolesAdminPerms = hasPermission(
                removedRolesSitePermissions,
                [BitFieldSitePermission.ADMINISTRATOR]
            );

            if (user.id !== userId && hasRemovedRolesAdminPerms)
                throw new TRPCError({
                    code: "BAD_REQUEST",
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

export const usersRouter = createTRPCRouter({
    getUsers: protectedProcedure
        .input(
            z.object({
                limit: z.number().min(1).max(50).default(10),
                page: z.number().min(1).default(1),
                search: z.string().optional(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.MANAGE_USERS |
                    BitFieldSitePermission.VIEW_USERS,
                "any"
            )
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { limit, page, search } = input;

            const data = await queries.users.getUsers({
                limit,
                page,
                search,
            });

            return data;
        }),
    currentUser: protectedProcedure.query(async ({ ctx }) => {
        const { user } = ctx;

        const cachedUser = await userCache.get(user.id);
        if (!cachedUser)
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
            });

        return cachedUser;
    }),
    addresses: userAddressesRouter,
    roles: userRolesRouter,
    wishlist: wishlistRouter,
    cart: cartRouter,
});
