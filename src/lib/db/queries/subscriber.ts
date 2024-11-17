import {
    CreateNewsletterSubscriber,
    newsletterSubscriberSchema,
} from "@/lib/validations";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { newsletterSubscribers } from "../schema";

class SubscriberQuery {
    async getSubscribers({
        limit,
        page,
        search,
        isActive,
    }: {
        limit: number;
        page: number;
        search?: string;
        isActive?: boolean;
    }) {
        const data = await db.query.newsletterSubscribers.findMany({
            where: and(
                isActive !== undefined
                    ? eq(newsletterSubscribers.isActive, isActive)
                    : undefined,
                !!search?.length
                    ? ilike(newsletterSubscribers.email, `%${search}%`)
                    : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(newsletterSubscribers.createdAt)],
            extras: {
                count: db.$count(newsletterSubscribers).as("subscriber_count"),
            },
        });

        const parsed = newsletterSubscriberSchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getSubscriber(id: string) {
        const data = await db.query.newsletterSubscribers.findFirst({
            where: eq(newsletterSubscribers.id, id),
        });

        return data;
    }

    async getSubscriberByEmail(email: string) {
        const data = await db.query.newsletterSubscribers.findFirst({
            where: eq(newsletterSubscribers.email, email),
        });

        return data;
    }

    async createSubscriber(values: CreateNewsletterSubscriber) {
        const data = await db
            .insert(newsletterSubscribers)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateSubscriber(email: string, isActive: boolean) {
        const data = await db
            .update(newsletterSubscribers)
            .set({
                isActive,
                updatedAt: new Date(),
            })
            .where(eq(newsletterSubscribers.email, email))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteSubscriber(id: string) {
        const data = await db
            .delete(newsletterSubscribers)
            .where(eq(newsletterSubscribers.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const subscriberQueries = new SubscriberQuery();
