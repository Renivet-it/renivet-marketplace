import {
    CreateMarketingStrip,
    marketingStripSchema,
    UpdateMarketingStrip,
} from "@/lib/validations";
import { and, desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { marketingStrip } from "../schema";

class MarketingStripQuery {
    async getMarketingStrips({
        limit,
        page,
        isActive,
        search,
    }: {
        limit: number;
        page: number;
        isActive?: boolean;
        search?: string;
    }) {
        const data = await db.query.marketingStrip.findMany({
            where: and(
                isActive !== undefined
                    ? eq(marketingStrip.isActive, isActive)
                    : undefined,
                !!search?.length
                    ? ilike(marketingStrip.title, `%${search}%`)
                    : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(marketingStrip.createdAt)],
            extras: {
                count: db
                    .$count(
                        marketingStrip,
                        and(
                            isActive !== undefined
                                ? eq(marketingStrip.isActive, isActive)
                                : undefined,
                            !!search?.length
                                ? ilike(marketingStrip.title, `%${search}%`)
                                : undefined
                        )
                    )
                    .as("marketing_strip_count"),
            },
        });

        const parsed = marketingStripSchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getMarketingStrip(id: string) {
        const data = await db.query.marketingStrip.findFirst({
            where: eq(marketingStrip.id, id),
        });

        return data;
    }

    async createMarketingStrip(
        values: CreateMarketingStrip & {
            imageUrl: string;
            url?: string;
        }
    ) {
        const data = await db
            .insert(marketingStrip)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateMarketingStrip(
        id: string,
        values: UpdateMarketingStrip & {
            imageUrl: string;
            url?: string;
        }
    ) {
        const data = await db
            .update(marketingStrip)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(marketingStrip.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateMarketingStripStatus(id: string, isActive: boolean) {
        const data = await db
            .update(marketingStrip)
            .set({
                isActive,
                updatedAt: new Date(),
            })
            .where(eq(marketingStrip.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteMarketingStrip(id: string) {
        const data = await db
            .delete(marketingStrip)
            .where(eq(marketingStrip.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const marketingStripQueries = new MarketingStripQuery();