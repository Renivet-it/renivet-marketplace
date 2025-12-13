import { CreateTicket, ticketSchema } from "@/lib/validations";
import { desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { tickets } from "../schema";
import { supportTickets, supportMessages } from "../schema";

class TicketQuery {
    async getCount() {
        return db.$count(tickets);
    }

    async getTickets({
        limit,
        page,
        search,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.tickets.findMany({
            where: !!search?.length
                ? ilike(tickets.email, `%${search}%`)
                : undefined,
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(tickets.createdAt)],
            extras: {
                count: db
                    .$count(
                        tickets,
                        !!search?.length
                            ? ilike(tickets.email, `%${search}%`)
                            : undefined
                    )
                    .as("ticket_count"),
            },
        });

        const parsed = ticketSchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getTicket(id: string) {
        const data = await db.query.tickets.findFirst({
            where: eq(tickets.id, id),
        });

        return data;
    }

    async createTicket(values: CreateTicket) {
        const data = await db
            .insert(tickets)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteTicket(id: string) {
        const data = await db
            .delete(tickets)
            .where(eq(tickets.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    
}

export const ticketQueries = new TicketQuery();
