import { BitFieldSitePermission } from "@/config/permissions";
import { userCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { hasPermission } from "@/lib/utils";
import { updateUserGeneralSchema } from "@/lib/validations";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const usersRouter = createTRPCRouter({
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
    updateUserGeneral: protectedProcedure
        .input(updateUserGeneralSchema)
        .mutation(async ({ ctx, input }) => {
            const { user } = ctx;
            const { firstName, lastName } = input;

            const client = await clerkClient();

            await client.users.updateUser(user.id, {
                firstName,
                lastName,
            });

            return input;
        }),
    addRole: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                roleId: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_USERS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { userId, roleId } = input;

            const [existingUser, existingRole] = await Promise.all([
                userCache.get(userId),
                db.query.roles.findFirst({
                    where: eq(schemas.roles.id, roleId),
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
            if (!existingRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Role not found",
                });

            if (existingUser.roles.some((role) => role.id === roleId))
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User already has this role",
                });

            await Promise.all([
                userCache.update({
                    ...existingUser,
                    roles: [...existingUser.roles, existingRole],
                }),
                db.insert(schemas.userRoles).values({
                    userId,
                    roleId,
                }),
            ]);

            return true;
        }),
    removeRole: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                roleId: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_USERS,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .mutation(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { userId, roleId } = input;

            const [existingUser, existingUserRole] = await Promise.all([
                userCache.get(userId),
                db.query.userRoles.findFirst({
                    where: and(
                        eq(schemas.userRoles.userId, userId),
                        eq(schemas.userRoles.roleId, roleId)
                    ),
                }),
            ]);
            if (!existingUser)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            if (!existingUserRole)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User role not found",
                });

            await Promise.all([
                userCache.update({
                    ...existingUser,
                    roles: existingUser.roles.filter(
                        (role) => role.id !== roleId
                    ),
                }),
                db
                    .delete(schemas.userRoles)
                    .where(
                        and(
                            eq(schemas.userRoles.userId, userId),
                            eq(schemas.userRoles.roleId, roleId)
                        )
                    ),
            ]);

            return true;
        }),
});
