import {
    CreateMarketingCampaign,
    CreateMarketingPartnership,
    MarketingCampaign,
    MarketingPartnership,
    marketingCampaignSchema,
    marketingPartnershipSchema,
    UpdateMarketingCampaign,
    UpdateMarketingPartnership,
} from "@/lib/validations";
import { and, desc, eq, ilike, lte } from "drizzle-orm";
import { db } from "..";
import { marketingCampaigns, marketingPartnerships } from "../schema";

class MarketingQueries {
    async getCampaigns({
        limit,
        page,
        search,
        status,
        type,
    }: {
        limit: number;
        page: number;
        search?: string;
        status?: MarketingCampaign["status"];
        type?: MarketingCampaign["type"];
    }) {
        const data = await db.query.marketingCampaigns.findMany({
            where: and(
                search ? ilike(marketingCampaigns.name, `%${search}%`) : undefined,
                status ? eq(marketingCampaigns.status, status) : undefined,
                type ? eq(marketingCampaigns.type, type) : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(marketingCampaigns.createdAt)],
            extras: {
                count: db.$count(marketingCampaigns).as("campaign_count"),
            },
        });

        return {
            data: marketingCampaignSchema.array().parse(data),
            count: +data?.[0]?.count || 0,
        };
    }

    async getCampaign(id: string) {
        const data = await db.query.marketingCampaigns.findFirst({
            where: eq(marketingCampaigns.id, id),
        });

        return data ? marketingCampaignSchema.parse(data) : null;
    }

    async createCampaign(values: CreateMarketingCampaign & { createdBy?: string | null }) {
        const data = await db
            .insert(marketingCampaigns)
            .values({
                ...values,
                createdBy: values.createdBy ?? null,
                scheduledAt: values.scheduledAt ?? null,
                metadata: values.metadata ?? {},
            })
            .returning()
            .then((rows) => rows[0]);

        return marketingCampaignSchema.parse(data);
    }

    async updateCampaign(id: string, values: Omit<UpdateMarketingCampaign, "id">) {
        const data = await db
            .update(marketingCampaigns)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(marketingCampaigns.id, id))
            .returning()
            .then((rows) => rows[0]);

        return data ? marketingCampaignSchema.parse(data) : null;
    }

    async getScheduledCampaignsDue(before = new Date()) {
        const rows = await db.query.marketingCampaigns.findMany({
            where: and(
                eq(marketingCampaigns.status, "scheduled"),
                lte(marketingCampaigns.scheduledAt, before)
            ),
            orderBy: [desc(marketingCampaigns.scheduledAt)],
        });

        return marketingCampaignSchema.array().parse(rows);
    }

    async getPartnerships({
        limit,
        page,
        search,
        status,
    }: {
        limit: number;
        page: number;
        search?: string;
        status?: MarketingPartnership["status"];
    }) {
        const data = await db.query.marketingPartnerships.findMany({
            where: and(
                search
                    ? ilike(marketingPartnerships.partnerName, `%${search}%`)
                    : undefined,
                status ? eq(marketingPartnerships.status, status) : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [desc(marketingPartnerships.createdAt)],
            extras: {
                count: db.$count(marketingPartnerships).as("partnership_count"),
            },
        });

        return {
            data: marketingPartnershipSchema.array().parse(data),
            count: +data?.[0]?.count || 0,
        };
    }

    async getPartnership(id: string) {
        const data = await db.query.marketingPartnerships.findFirst({
            where: eq(marketingPartnerships.id, id),
        });

        return data ? marketingPartnershipSchema.parse(data) : null;
    }

    async createPartnership(values: CreateMarketingPartnership) {
        const data = await db
            .insert(marketingPartnerships)
            .values({
                ...values,
                metadata: values.metadata ?? {},
                couponCode: values.couponCode ?? null,
                notes: values.notes ?? null,
            })
            .returning()
            .then((rows) => rows[0]);

        return marketingPartnershipSchema.parse(data);
    }

    async updatePartnership(id: string, values: Omit<UpdateMarketingPartnership, "id">) {
        const data = await db
            .update(marketingPartnerships)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(marketingPartnerships.id, id))
            .returning()
            .then((rows) => rows[0]);

        return data ? marketingPartnershipSchema.parse(data) : null;
    }

    async deletePartnership(id: string) {
        const data = await db
            .delete(marketingPartnerships)
            .where(eq(marketingPartnerships.id, id))
            .returning()
            .then((rows) => rows[0]);

        return data ? marketingPartnershipSchema.parse(data) : null;
    }
}

export const marketingQueries = new MarketingQueries();
