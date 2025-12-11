import {
  createTRPCRouter,
  protectedProcedure,
} from "@/lib/trpc/trpc";

import { z } from "zod";

import { db } from "@/lib/db";
import { supportTickets, supportMessages } from "@/lib/db/schema";
import { desc, eq, ilike, and } from "drizzle-orm";

export const brandSupportRouter = createTRPCRouter({

  // ------------------------------------------------------
  // LIST BRAND TICKETS
  // ------------------------------------------------------
  listTickets: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        page: z.number().default(1),
        search: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, page, search, status } = input;

      const filters: any[] = [
        eq(supportTickets.brandId, ctx.user.brand.id),
      ];

      if (search?.length)
        filters.push(ilike(supportTickets.title, `%${search}%`));

      if (status && status !== "all")
        filters.push(eq(supportTickets.status, status));

      const where =
        filters.length === 1 ? filters[0] : and(...filters);

      const rows = await db.query.supportTickets.findMany({
        where,
        limit,
        offset: (page - 1) * limit,
        orderBy: [desc(supportTickets.createdAt)],
        extras: {
          count: db.$count(supportTickets, where).as("total_count"),
        },
      });

      return {
        data: rows,
        count: +rows?.[0]?.total_count || 0,
      };
    }),


  // ------------------------------------------------------
  // GET SINGLE TICKET (BRAND ONLY)
  // ------------------------------------------------------
  getTicket: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input: ticketId }) => {
      const row = await db.query.supportTickets.findFirst({
        where: eq(supportTickets.id, ticketId),
      });

      if (!row || row.brandId !== ctx.user.brand.id) {
        throw new Error("Unauthorized");
      }

      return row;
    }),


  // ------------------------------------------------------
  // CREATE TICKET
  // ------------------------------------------------------
  createTicket: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        issueType: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const row = await db
        .insert(supportTickets)
        .values({
          brandId: ctx.user.brand.id,
          title: input.title,
          issueType: input.issueType,
          description: input.description ?? null,
        })
        .returning()
        .then((res) => res[0]);

      return row;
    }),


  // ------------------------------------------------------
  // SEND MESSAGE
  // ------------------------------------------------------
  sendMessage: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        text: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inserted = await db
        .insert(supportMessages)
        .values({
          ticketId: input.ticketId,
          sender: "brand",
          senderId: ctx.user.id,
          text: input.text,
        })
        .returning()
        .then((res) => res[0]);

      return inserted;
    }),


  // ------------------------------------------------------
  // GET MESSAGES
  // ------------------------------------------------------
  getMessages: protectedProcedure
    .input(z.string())
    .query(async ({ input: ticketId }) => {
      return await db.query.supportMessages.findMany({
        where: eq(supportMessages.ticketId, ticketId),
        orderBy: [supportMessages.createdAt],
      });
    }),
});
