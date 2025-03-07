import {
    advertisementSchema,
    CreateAdvertisement,
    CreateHomeBrandProduct,
    CreateHomeShopByCategory,
    homeBrandProductSchema,
    homeShopByCategorySchema,
    UpdateAdvertisement,
    UpdateHomeBrandProduct,
    UpdateHomeShopByCategory,
} from "@/lib/validations";
import { and, asc, desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import {
    advertisements,
    homeBrandProducts,
    homeShopByCategories,
    homeShopByCategoryTitle,
} from "../schema";

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

class HomeBrandProductsQuery {
    async getAllHomeBrandProducts() {
        const data = await db.query.homeBrandProducts.findMany({
            orderBy: [asc(homeBrandProducts.position)],
        });

        return data;
    }

    async getHomeBrandProducts({
        limit,
        page,
    }: {
        limit: number;
        page: number;
    }) {
        const data = await db.query.homeBrandProducts.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeBrandProducts.position)],
            extras: {
                count: db
                    .$count(homeBrandProducts)
                    .as("home_brand_product_count"),
            },
        });

        const parsed = homeBrandProductSchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomeBrandProduct(id: string) {
        const data = await db.query.homeBrandProducts.findFirst({
            where: eq(homeBrandProducts.id, id),
        });

        return data;
    }

    async createHomeBrandProduct(
        values: CreateHomeBrandProduct & {
            imageUrl: string;
        }
    ) {
        const count = await db.$count(homeBrandProducts);

        const data = await db
            .insert(homeBrandProducts)
            .values({
                ...values,
                position: count + 1,
            })
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomeBrandProduct(
        id: string,
        values: UpdateHomeBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeBrandProducts)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeBrandProducts.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomeBrandProduct(id: string) {
        const data = await db
            .delete(homeBrandProducts)
            .where(eq(homeBrandProducts.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomeBrandProductPositions(
        items: { id: string; position: number }[]
    ) {
        await db.transaction(async (tx) => {
            for (const item of items) {
                await tx
                    .update(homeBrandProducts)
                    .set({
                        position: item.position,
                        updatedAt: new Date(),
                    })
                    .where(eq(homeBrandProducts.id, item.id));
            }
        });

        return true;
    }
}

class HomeShopByCategoriesQuery {
    async getAllHomeShopByCategories() {
        const data = await db.query.homeShopByCategories.findMany({
            orderBy: [asc(homeShopByCategories.createdAt)],
        });

        return data;
    }

    async getHomeShopByCategories({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeShopByCategories.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeShopByCategories.createdAt)],
            extras: {
                count: db
                    .$count(homeShopByCategories)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomeShopByCategory(id: string) {
        const data = await db.query.homeShopByCategories.findFirst({
            where: eq(homeShopByCategories.id, id),
        });

        return data;
    }

    async createHomeShopByCategory(
        values: CreateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeShopByCategories)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomeShopByCategory(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeShopByCategories)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeShopByCategories.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomeShopByCategory(id: string) {
        const data = await db
            .delete(homeShopByCategories)
            .where(eq(homeShopByCategories.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

class HomeShopByCategoryTitleQuery {
    async getHomeShopByCategoryTitle() {
        const data = await db.query.homeShopByCategoryTitle.findFirst();
        return data;
    }

    async createHomeShopByCategoryTitle(title: string) {
        const data = await db
            .insert(homeShopByCategoryTitle)
            .values({ title })
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomeShopByCategoryTitle(title: string) {
        // eslint-disable-next-line drizzle/enforce-update-with-where
        const data = await db
            .update(homeShopByCategoryTitle)
            .set({ title, updatedAt: new Date() })
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomeShopByCategoryTitle() {
        // eslint-disable-next-line drizzle/enforce-delete-with-where
        const data = await db
            .delete(homeShopByCategoryTitle)
            .returning()
            .then((res) => res[0]);

        return data;
    }
}

export const advertisementQueries = new AdvertiseMentQuery();
export const homeBrandProductQueries = new HomeBrandProductsQuery();
export const homeShopByCategoryQueries = new HomeShopByCategoriesQuery();
export const homeShopByCategoryTitleQueries =
    new HomeShopByCategoryTitleQuery();
