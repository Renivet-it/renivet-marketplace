import { BitFieldSitePermission } from "@/config/permissions";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getUserPermissions, hasPermission } from "../utils";
import { Context } from "./context";

const map = new Map<string, number[]>();
const MAX_REQUESTS = 100;
const WINDOW_SIZE = 60 * 1000;

export const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.cause instanceof ZodError
                        ? error.cause.flatten()
                        : null,
            },
        };
    },
});

const ratelimiter = t.middleware(({ ctx, next }) => {
    const { req } = ctx;

    const identifier = req.headers.get("x-forwarded-for");
    if (!identifier) return next({ ctx });

    const now = Date.now();
    const requests = map.get(identifier) ?? [];

    while (requests.length > 0 && requests[0] < now - WINDOW_SIZE)
        requests.shift();

    if (requests.length >= MAX_REQUESTS)
        throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests",
        });

    requests.push(now);
    map.set(identifier, requests);

    return next({
        ctx,
    });
});

const isAuth = t.middleware(async ({ ctx, next }) => {
    if (!ctx.user || !ctx.auth)
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You're not authorized",
        });

    const userPermissions = getUserPermissions(ctx.user.roles);

    return next({
        ctx: {
            ...ctx,
            user: { ...ctx.user, ...userPermissions },
            auth: ctx.auth,
        },
    });
});

const isBrand = isAuth.unstable_pipe(async ({ ctx, next }) => {
    if (ctx.user.brandPermissions <= 0)
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You're not authorized",
        });

    return next({
        ctx,
    });
});

const isAdmin = isAuth.unstable_pipe(async ({ ctx, next }) => {
    const isAuthorized = hasPermission(ctx.user.sitePermissions, [
        BitFieldSitePermission.ADMINISTRATOR,
    ]);

    if (!isAuthorized)
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You're not authorized",
        });

    return next({
        ctx,
    });
});

const errorHandler = t.middleware(async ({ next }) => {
    try {
        return await next();
    } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
                error instanceof Error
                    ? error.message
                    : "An error occurred, please try again later",
        });
    }
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure.use(errorHandler).use(ratelimiter);
export const protectedProcedure = publicProcedure.use(isAuth);
export const brandProcedure = protectedProcedure.use(isBrand);
export const adminProcedure = protectedProcedure.use(isAdmin);
