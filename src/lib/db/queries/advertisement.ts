import {
    advertisementSchema,
    CreateAdvertisement,
    UpdateAdvertisement,
} from "@/lib/validations";
import { and, asc, desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import { advertisements } from "../schema";

class AdvertiseMentQuery {
    async getAllAdvertisements({
        isPublished,
        orderBy,
    }: {
        isPublished: boolean;
        orderBy: "position" | "timestamp";
    }) {
        const data = await db.query.advertisements.findMany({
            where: eq(advertisements.isPublished, isPublished),
            orderBy:
                orderBy === "position"
                    ? [asc(advertisements.position)]
                    : [desc(advertisements.createdAt)],
        });

        return data;
    }

    async getAdvertisements({
        limit,
        page,
        search,
        isPublished,
    }: {
        limit: number;
        page: number;
        search?: string;
        isPublished?: boolean;
    }) {
        const data = await db.query.advertisements.findMany({
            where: and(
                !!search?.length
                    ? ilike(advertisements.title, `%${search}%`)
                    : undefined,
                isPublished !== undefined
                    ? eq(advertisements.isPublished, isPublished)
                    : undefined
            ),
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(advertisements.position)],
            extras: {
                count: db
                    .$count(
                        advertisements,
                        and(
                            !!search?.length
                                ? ilike(advertisements.title, `%${search}%`)
                                : undefined,
                            isPublished !== undefined
                                ? eq(advertisements.isPublished, isPublished)
                                : undefined
                        )
                    )
                    .as("advertisement_count"),
            },
        });

        const parsed = advertisementSchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAdvertisement(id: string) {
        const data = await db.query.advertisements.findFirst({
            where: eq(advertisements.id, id),
        });

        return data;
    }

    async createAdvertisement(
        values: CreateAdvertisement & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(advertisements)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateAdvertisement(
        id: string,
        values: UpdateAdvertisement & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(advertisements)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(advertisements.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateAdvertisementStatus(id: string, isPublished: boolean) {
        let position = 0;

        if (isPublished) {
            const count = await this.getPublishedAdvertisementsCount();
            position = count + 1;
        }

        const data = await db
            .update(advertisements)
            .set({
                isPublished,
                position,
                updatedAt: new Date(),
            })
            .where(eq(advertisements.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteAdvertisement(id: string) {
        const data = await db
            .delete(advertisements)
            .where(eq(advertisements.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async getPublishedAdvertisementsCount() {
        const data = await db.$count(
            advertisements,
            eq(advertisements.isPublished, true)
        );
        return +data || 0;
    }

    async updateAdvertisementPositions(
        items: { id: string; position: number }[]
    ) {
        await db.transaction(async (tx) => {
            for (const item of items) {
                await tx
                    .update(advertisements)
                    .set({
                        position: item.position,
                        updatedAt: new Date(),
                    })
                    .where(eq(advertisements.id, item.id));
            }
        });

        return true;
    }
}

export const advertisementQueries = new AdvertiseMentQuery();
