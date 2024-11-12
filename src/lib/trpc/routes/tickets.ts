import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { hasPermission } from "@/lib/utils";
import { createTicketSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { desc, eq, ilike } from "drizzle-orm";
import { z } from "zod";

export const ticketRouter = createTRPCRouter({
    getTickets: protectedProcedure
        .input(
            z.object({
                limit: z.number().int().positive().default(10),
                page: z.number().int().positive().default(1),
                search: z.string().optional(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.VIEW_FEEDBACK,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .query(async ({ ctx, input }) => {
            const { db, schemas } = ctx;
            const { limit, page, search } = input;

            const tickets = await db.query.tickets.findMany({
                where: !!search?.length
                    ? ilike(schemas.tickets.email, `%${search}%`)
                    : undefined,
                limit,
                offset: (page - 1) * limit,
                orderBy: [desc(schemas.tickets.createdAt)],
                extras: {
                    ticketCount: db.$count(schemas.tickets).as("ticket_count"),
                },
            });

            return tickets;
        }),
    getTicket: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.VIEW_FEEDBACK,
            ]);
            if (!isAuthorized)
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "You're not authorized",
                });

            return next({ ctx });
        })
        .query(async ({ input, ctx }) => {
            const { db, schemas } = ctx;
            const { id } = input;

            const existingTicket = await db.query.tickets.findFirst({
                where: eq(schemas.tickets.id, id),
            });
            if (!existingTicket)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Ticket not found",
                });

            return existingTicket;
        }),
    createTicket: publicProcedure
        .input(createTicketSchema)
        .mutation(async ({ input, ctx }) => {
            const { db, schemas } = ctx;

            const newTicket = await db
                .insert(schemas.tickets)
                .values(input)
                .returning()
                .then((res) => res[0]);

            return newTicket;
        }),
    deleteTicket: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(({ ctx, next }) => {
            const { user } = ctx;

            const isAuthorized = hasPermission(user.sitePermissions, [
                BitFieldSitePermission.MANAGE_FEEDBACK,
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
            const { id } = input;

            const existingTicket = await db.query.tickets.findFirst({
                where: eq(schemas.tickets.id, id),
            });
            if (!existingTicket) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Ticket not found",
                });
            }

            await db.delete(schemas.tickets).where(eq(schemas.tickets.id, id));
            return true;
        }),
});
