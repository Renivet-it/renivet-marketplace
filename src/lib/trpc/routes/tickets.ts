import { BitFieldSitePermission } from "@/config/permissions";
import {
    createTRPCRouter,
    isTRPCAuth,
    protectedProcedure,
    publicProcedure,
} from "@/lib/trpc/trpc";
import { createTicketSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
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
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_FEEDBACK |
                    BitFieldSitePermission.MANAGE_FEEDBACK,
                "any"
            )
        )
        .query(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { limit, page, search } = input;

            const tickets = await queries.tickets.getTickets({
                limit,
                page,
                search,
            });

            return tickets;
        }),
    getTicket: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(
            isTRPCAuth(
                BitFieldSitePermission.VIEW_FEEDBACK |
                    BitFieldSitePermission.MANAGE_FEEDBACK,
                "any"
            )
        )
        .query(async ({ input, ctx }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingTicket = await queries.tickets.getTicket(id);
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
            const { queries } = ctx;

            const newTicket = await queries.tickets.createTicket(input);
            return newTicket;
        }),
    deleteTicket: protectedProcedure
        .input(
            z.object({
                id: z.string(),
            })
        )
        .use(isTRPCAuth(BitFieldSitePermission.MANAGE_FEEDBACK))
        .mutation(async ({ ctx, input }) => {
            const { queries } = ctx;
            const { id } = input;

            const existingTicket = await queries.tickets.getTicket(id);
            if (!existingTicket) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Ticket not found",
                });
            }

            await queries.tickets.deleteTicket(id);
            return true;
        }),
});
