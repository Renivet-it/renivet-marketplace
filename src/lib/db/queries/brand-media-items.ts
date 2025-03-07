import { CreateBrandMediaItem, UpdateBrandMediaItem } from "@/lib/validations";
import { eq, inArray } from "drizzle-orm";
import { db } from "..";
import { brandMediaItems } from "../schema";

class BrandMediaItemQuery {
    async getCount(brandId?: string) {
        const data = await db.$count(
            brandMediaItems,
            brandId ? eq(brandMediaItems.brandId, brandId) : undefined
        );
        return +data || 0;
    }

    async getBrandMediaItemsByBrand(brandId?: string) {
        const data = await db.query.brandMediaItems.findMany({
            where: brandId ? eq(brandMediaItems.brandId, brandId) : undefined,
        });

        return {
            data: data.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            ),
            count: data.length,
        };
    }

    async getBrandMediaItemsByIds(ids: string[]) {
        const data = await db.query.brandMediaItems.findMany({
            where: inArray(brandMediaItems.id, ids),
        });

        return {
            data: data.sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            ),
            count: data.length,
        };
    }

    async getBrandMediaItem(id: string) {
        const data = await db.query.brandMediaItems.findFirst({
            where: eq(brandMediaItems.id, id),
        });
        if (!data) return null;

        return data;
    }

    async bulkCreateBrandMediaItems(values: CreateBrandMediaItem[]) {
        const data = await db
            .insert(brandMediaItems)
            .values(values)
            .returning()
            .then((res) => res);

        return data;
    }

    async updateBrandMediaItem(id: string, values: UpdateBrandMediaItem) {
        const data = await db
            .update(brandMediaItems)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(brandMediaItems.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async bulkDeleteBrandMediaItems(ids: string[]) {
        const data = await db
            .delete(brandMediaItems)
            .where(inArray(brandMediaItems.id, ids))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const brandMediaItemQueries = new BrandMediaItemQuery();
