import { userCache } from "@/lib/redis/methods";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/trpc";
import { TRPCError } from "@trpc/server";

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
});
