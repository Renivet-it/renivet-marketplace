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
    CreateHomeShopByNewCategory,
    homeShopByNewCategorySchema,
    UpdateHomeShopByNewCategory,
    createWomenBrandProduct

} from "@/lib/validations";
import { and, asc, desc, eq, ilike } from "drizzle-orm";
import { db } from "..";
import {
    advertisements,
    homeBrandProducts,
    homeShopByCategories,
    homeShopByCategoryTitle,
    homeshopbyNewCategory,
    womenHomeBannersSection,
    womenExploreCategorySection,
    womenElavateLookSection,
    womenMiddleBuyNowSection
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


class WomenHomeSectionQuery{

       async getAllHomeShopByCategories(p0: { limit: number; page: number; }) {
        const data = await db.query.womenHomeBannersSection.findMany({
            orderBy: [asc(womenHomeBannersSection.createdAt)],
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
        const data = await db.query.womenHomeBannersSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenHomeBannersSection.createdAt)],
            extras: {
                count: db
                    .$count(womenHomeBannersSection)
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
        const data = await db.query.womenHomeBannersSection.findFirst({
            where: eq(womenHomeBannersSection.id, id),
        });

        return data;
    }

    async createHomeShopByCategory(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenHomeBannersSection)
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
            .update(womenHomeBannersSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenHomeBannersSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomeShopByCategory(id: string) {
        const data = await db
            .delete(womenHomeBannersSection)
            .where(eq(womenHomeBannersSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



    //explore categories

        async getAllexploreCategories(p0: { limit: number; page: number; }) {
        const data = await db.query.womenExploreCategorySection.findMany({
            orderBy: [asc(womenExploreCategorySection.createdAt)],
        });

        return data;
    }

    async getAllexploreCategoriesAll({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenExploreCategorySection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenExploreCategorySection.createdAt)],
            extras: {
                count: db
                    .$count(womenExploreCategorySection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllexploreCategory(id: string) {
        const data = await db.query.womenExploreCategorySection.findFirst({
            where: eq(womenExploreCategorySection.id, id),
        });

        return data;
    }

    async createAllexploreCategories(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenExploreCategorySection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateAllexploreCategories(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenExploreCategorySection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenExploreCategorySection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteAllexploreCategories(id: string) {
        const data = await db
            .delete(womenExploreCategorySection)
            .where(eq(womenExploreCategorySection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



    //elavatelooks
          async getAllelavateLooks(p0: { limit: number; page: number; }) {
        const data = await db.query.womenElavateLookSection.findMany({
            orderBy: [asc(womenElavateLookSection.createdAt)],
        });
console.log("test");
        return data;
    }

    async getAllelavateLooksAll({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenElavateLookSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenElavateLookSection.createdAt)],
            extras: {
                count: db
                    .$count(womenElavateLookSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllelavateLook(id: string) {
        const data = await db.query.womenElavateLookSection.findFirst({
            where: eq(womenElavateLookSection.id, id),
        });

        return data;
    }

    async createAllelavateLooks(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenElavateLookSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateAllelavateLooks(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenElavateLookSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenElavateLookSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteAllelavateLooks(id: string) {
        const data = await db
            .delete(womenElavateLookSection)
            .where(eq(womenElavateLookSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


        //outfit varients
        async getAlloutfitVarients(p0: { limit: number; page: number; }) {
            const data = await db.query.womenMiddleBuyNowSection.findMany({
                orderBy: [asc(womenMiddleBuyNowSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getoutfitVarients({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenMiddleBuyNowSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenMiddleBuyNowSection.createdAt)],
            extras: {
                count: db
                    .$count(womenMiddleBuyNowSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getoutfitVarient(id: string) {
        const data = await db.query.womenMiddleBuyNowSection.findFirst({
            where: eq(womenMiddleBuyNowSection.id, id),
        });

        return data;
    }

    async createAlloutfitVarients(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenMiddleBuyNowSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateAlloutfitVarients(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenMiddleBuyNowSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenMiddleBuyNowSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteoutfitVarients(id: string) {
        const data = await db
            .delete(womenMiddleBuyNowSection)
            .where(eq(womenMiddleBuyNowSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
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


class HomeShopByNewCategoriesQuery {
    async getAllHomeShopByNewCategories() {
        const data = await db.query.homeshopbyNewCategory.findMany({
            orderBy: [asc(homeshopbyNewCategory.createdAt)],
        });

        return data;
    }

    async getHomeShopByNewCategories({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeshopbyNewCategory.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeshopbyNewCategory.createdAt)],
            extras: {
                count: db
                    .$count(homeshopbyNewCategory)
                    .as("home_shop_by_new_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomeShopByNewCategory(id: string) {
        const data = await db.query.homeshopbyNewCategory.findFirst({
            where: eq(homeshopbyNewCategory.id, id),
        });

        return data;
    }

    async createHomeShopByNewCategory(
        values: CreateHomeShopByNewCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeshopbyNewCategory)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomeShopByNewCategory(
        id: string,
        values: UpdateHomeShopByNewCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeshopbyNewCategory)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeshopbyNewCategory.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomeShopByNewCategory(id: string) {
        const data = await db
            .delete(homeshopbyNewCategory)
            .where(eq(homeshopbyNewCategory.id, id))
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
export const WomenHomeSectionQueries = new WomenHomeSectionQuery();
export const homeShopByNewCategoryQueries = new HomeShopByNewCategoriesQuery();
export const homeShopByCategoryTitleQueries =
    new HomeShopByCategoryTitleQuery();
