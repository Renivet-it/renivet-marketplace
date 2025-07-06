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
import { mediaCache } from "@/lib/redis/methods";

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
    womenMiddleBuyNowSection,
    womenStyleDirectorySection,
    womenNewCollectionSection,
    womenOfferSection,
    womenMoodBoardSection,
    womenStyleSubstanceSection,
    womenSummerSaleSection,
    womenFindYourStyleSection,
    womenSuggestedLookSection,
    womenBranStoryTellingSection,
    womenBrandSection,
    womenBrandSkinCareSection,
    menHomeBannersSection,
    menExploreCategory,
    menElavateLookSection,
    menMiddleBaannerSection,
    menstyleDirectory,
    menTopCollection,
    menDiscountOfferSection,
    menSuggestedLookForYou,
    menNewCollectionSectionn,
    menTopCollectionBanner,
    womenStyleWithSubstanceMiddlePageSection,
    womenNewCollectionDiscountSection,
    womenGetReadySection,
    menCuratedHerEssence,
    menFreshInkCollectionSection,
    menMoodBoardSection,
    kidHomeBannersSection,
    kidExploreCategory,
    kidElavateLookSection,
    kidSpecialCareSection,
    kidsDiscountOfferSection,
    kidsDollBuyingSectionn,
    kidsTwiningMomSection

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
           title: string | null; // Make title nullable
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
           title: string | null; // Make title nullable
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

     //style directory
        async getAllstyleDirectory(p0: { limit: number; page: number; }) {
            const data = await db.query.womenStyleDirectorySection.findMany({
                orderBy: [asc(womenStyleDirectorySection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getstyleDirectories({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenStyleDirectorySection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenStyleDirectorySection.createdAt)],
            extras: {
                count: db
                    .$count(womenStyleDirectorySection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getstyledirectory(id: string) {
        const data = await db.query.womenStyleDirectorySection.findFirst({
            where: eq(womenStyleDirectorySection.id, id),
        });

        return data;
    }

    async createAllstyleDirectory(
        values: createWomenBrandProduct & {
            imageUrl: string;
            title: string | null; // Make title nullable
        }
    ) {
        const data = await db
            .insert(womenStyleDirectorySection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateAllstyleDirectory(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenStyleDirectorySection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenStyleDirectorySection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletestyleDirectory(id: string) {
        const data = await db
            .delete(womenStyleDirectorySection)
            .where(eq(womenStyleDirectorySection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

        //new collection
        async getNewCollections(p0: { limit: number; page: number; }) {
            const data = await db.query.womenNewCollectionSection.findMany({
                orderBy: [asc(womenNewCollectionSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getAllNewCollection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenNewCollectionSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenNewCollectionSection.createdAt)],
            extras: {
                count: db
                    .$count(womenNewCollectionSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getNewCollection(id: string) {
        const data = await db.query.womenNewCollectionSection.findFirst({
            where: eq(womenNewCollectionSection.id, id),
        });
        console.log("testdata", id);

        return data;
    }

    async createNewCollectionDirectory(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenNewCollectionSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateNewCollectionDirectory(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenNewCollectionSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenNewCollectionSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletNewCollectionDirectory(id: string) {
        const data = await db
            .delete(womenNewCollectionSection)
            .where(eq(womenNewCollectionSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


    //women-offer-section

      async getNewOfferSections(p0: { limit: number; page: number; }) {
            const data = await db.query.womenOfferSection.findMany({
                orderBy: [asc(womenOfferSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getAllNewOfferSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenOfferSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenOfferSection.createdAt)],
            extras: {
                count: db
                    .$count(womenOfferSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getNewOfferSection(id: string) {
        const data = await db.query.womenOfferSection.findFirst({
            where: eq(womenOfferSection.id, id),
        });

        return data;
    }

    async createNewOfferSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenOfferSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateNewOfferSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenOfferSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenOfferSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletNewOfferSection(id: string) {
        const data = await db
            .delete(womenOfferSection)
            .where(eq(womenOfferSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

// womenMoodBoardSection


      async getWomenMoodBoards(p0: { limit: number; page: number; }) {
            const data = await db.query.womenMoodBoardSection.findMany({
                orderBy: [asc(womenMoodBoardSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getAllWomenMoodBoard({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenMoodBoardSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenMoodBoardSection.createdAt)],
            extras: {
                count: db
                    .$count(womenMoodBoardSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getWomenMoodBoard(id: string) {
        const data = await db.query.womenMoodBoardSection.findFirst({
            where: eq(womenMoodBoardSection.id, id),
        });

        return data;
    }

    async createWomenMoodBoard(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenMoodBoardSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateWomenMoodBoard(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenMoodBoardSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenMoodBoardSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletWomenMoodBoard(id: string) {
        const data = await db
            .delete(womenMoodBoardSection)
            .where(eq(womenMoodBoardSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


    // StyleSubstanceSection


      async getWomenStyleSubstanceSections(p0: { limit: number; page: number; }) {
            const data = await db.query.womenStyleSubstanceSection.findMany({
                orderBy: [asc(womenStyleSubstanceSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getAllWomenStyleSubstanceSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenStyleSubstanceSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenStyleSubstanceSection.createdAt)],
            extras: {
                count: db
                    .$count(womenStyleSubstanceSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getWomenStyleSubstanceSection(id: string) {
        const data = await db.query.womenStyleSubstanceSection.findFirst({
            where: eq(womenStyleSubstanceSection.id, id),
        });

        return data;
    }

    async createWomenStyleSubstanceSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenStyleSubstanceSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateWomenStyleSubstanceSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenStyleSubstanceSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenStyleSubstanceSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletWomenStyleSubstanceSection(id: string) {
        const data = await db
            .delete(womenStyleSubstanceSection)
            .where(eq(womenStyleSubstanceSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



      // StyleSubstanceSection


      async getWomenSummerSaleSections(p0: { limit: number; page: number; }) {
            const data = await db.query.womenSummerSaleSection.findMany({
                orderBy: [asc(womenSummerSaleSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getAllWomenSummerSaleSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenSummerSaleSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenSummerSaleSection.createdAt)],
            extras: {
                count: db
                    .$count(womenSummerSaleSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getWomenSummerSaleSection(id: string) {
        const data = await db.query.womenSummerSaleSection.findFirst({
            where: eq(womenSummerSaleSection.id, id),
        });

        return data;
    }

    async createWomenSummerSaleSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenSummerSaleSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateWomenSummerSaleSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenSummerSaleSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenSummerSaleSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletWomenSummerSaleSection(id: string) {
        const data = await db
            .delete(womenSummerSaleSection)
            .where(eq(womenSummerSaleSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


          // StyleSubstanceSection


      async getWomenFindYourStyleSections(p0: { limit: number; page: number; }) {
            const data = await db.query.womenFindYourStyleSection.findMany({
                orderBy: [asc(womenFindYourStyleSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getAllWomenFindYourStyleSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenFindYourStyleSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenFindYourStyleSection.createdAt)],
            extras: {
                count: db
                    .$count(womenFindYourStyleSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getWomenFindYourStyleSection(id: string) {
        const data = await db.query.womenFindYourStyleSection.findFirst({
            where: eq(womenFindYourStyleSection.id, id),
        });

        return data;
    }

    async createWomenFindYourStyleSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenFindYourStyleSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateWomenFindYourStyleSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenFindYourStyleSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenFindYourStyleSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletWomenFindYourStyleSection(id: string) {
        const data = await db
            .delete(womenFindYourStyleSection)
            .where(eq(womenFindYourStyleSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


        // StyleSubstanceSection


      async getSuggestedLookSections(p0: { limit: number; page: number; }) {
            const data = await db.query.womenSuggestedLookSection.findMany({
                orderBy: [asc(womenSuggestedLookSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getAllSuggestedLookSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenSuggestedLookSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenSuggestedLookSection.createdAt)],
            extras: {
                count: db
                    .$count(womenSuggestedLookSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getSuggestedLookSection(id: string) {
        const data = await db.query.womenSuggestedLookSection.findFirst({
            where: eq(womenSuggestedLookSection.id, id),
        });

        return data;
    }

    async createSuggestedLookSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenSuggestedLookSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateSuggestedLookSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenSuggestedLookSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenSuggestedLookSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletSuggestedLookSection(id: string) {
        const data = await db
            .delete(womenSuggestedLookSection)
            .where(eq(womenSuggestedLookSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


            // StyleSubstanceSection


      async getwomenBrandSections(p0: { limit: number; page: number; }) {
            const data = await db.query.womenBrandSection.findMany({
                orderBy: [asc(womenBrandSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getAllwomenBrandSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenBrandSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenBrandSection.createdAt)],
            extras: {
                count: db
                    .$count(womenBrandSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getwomenBrandSection(id: string) {
        const data = await db.query.womenBrandSection.findFirst({
            where: eq(womenBrandSection.id, id),
        });

        return data;
    }

    async createwomenBrandSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenBrandSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatewomenBrandSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenBrandSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenBrandSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletwomenBrandSection(id: string) {
        const data = await db
            .delete(womenBrandSection)
            .where(eq(womenBrandSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


      // StyleSubstanceSection


      async getwomenBranStoryTellingSections(p0: { limit: number; page: number; }) {
            const data = await db.query.womenBranStoryTellingSection.findMany({
                orderBy: [asc(womenBranStoryTellingSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getAllwomenBranStoryTellingSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenBranStoryTellingSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenBranStoryTellingSection.createdAt)],
            extras: {
                count: db
                    .$count(womenBranStoryTellingSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getwomenBranStoryTellingSection(id: string) {
        const data = await db.query.womenBranStoryTellingSection.findFirst({
            where: eq(womenBranStoryTellingSection.id, id),
        });

        return data;
    }

    async createwomenBranStoryTellingSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenBranStoryTellingSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatewomenBranStoryTellingSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenBranStoryTellingSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenBranStoryTellingSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletwomenBranStoryTellingSection(id: string) {
        const data = await db
            .delete(womenBranStoryTellingSection)
            .where(eq(womenBranStoryTellingSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


      // StyleSubstanceSection


      async getwomenBrandSkinCareSections(p0: { limit: number; page: number; }) {
            const data = await db.query.womenBrandSkinCareSection.findMany({
                orderBy: [asc(womenBrandSkinCareSection.createdAt)],
            });
            console.log("test");
            return data;
        }

    async getAllwomenBrandSkinCareSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenBrandSkinCareSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenBrandSkinCareSection.createdAt)],
            extras: {
                count: db
                    .$count(womenBrandSkinCareSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getwomenBrandSkinCareSection(id: string) {
        const data = await db.query.womenBrandSkinCareSection.findFirst({
            where: eq(womenBrandSkinCareSection.id, id),
        });

        return data;
    }

    async createwomenBrandSkinCareSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenBrandSkinCareSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatewomenBrandSkinCareSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenBrandSkinCareSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenBrandSkinCareSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletwomenBrandSkinCareSection(id: string) {
        const data = await db
            .delete(womenBrandSkinCareSection)
            .where(eq(womenBrandSkinCareSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }




    //men section

    async getMenHomeBannerSections(p0: { limit: number; page: number; }) {
        const data = await db.query.menHomeBannersSection.findMany({
            orderBy: [asc(menHomeBannersSection.createdAt)],
        });

        return data;
    }

    async getAllMenHomeBannerSections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menHomeBannersSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menHomeBannersSection.createdAt)],
            extras: {
                count: db
                    .$count(menHomeBannersSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllMenHomeBannerSection(id: string) {
        const data = await db.query.menHomeBannersSection.findFirst({
            where: eq(menHomeBannersSection.id, id),
        });

        return data;
    }

    async createMenHomeBannerSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(menHomeBannersSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateMenHomeBannerSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menHomeBannersSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menHomeBannersSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteMenHomeBannerSection(id: string) {
        const data = await db
            .delete(menHomeBannersSection)
            .where(eq(menHomeBannersSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


    //explore category section

       async getMenExploreCategorySections(p0: { limit: number; page: number; }) {
        const data = await db.query.menExploreCategory.findMany({
            orderBy: [asc(menExploreCategory.createdAt)],
        });

        return data;
    }

    async getAllMenExploreCategorySections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menExploreCategory.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menExploreCategory.createdAt)],
            extras: {
                count: db
                    .$count(menExploreCategory)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllMenExploreCategorySection(id: string) {
        const data = await db.query.menExploreCategory.findFirst({
            where: eq(menExploreCategory.id, id),
        });

        return data;
    }

    async createMenExploreCategorySection(
        values: createWomenBrandProduct & {
            imageUrl: string;
            title: string | null; // Make title nullable
        }
    ) {
        const data = await db
            .insert(menExploreCategory)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateMenExploreCategorySection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menExploreCategory)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menExploreCategory.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteMenExploreCategorySection(id: string) {
        const data = await db
            .delete(menExploreCategory)
            .where(eq(menExploreCategory.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



    //men elavate looks


      async getMenelevateLooksections(p0: { limit: number; page: number; }) {
        const data = await db.query.menElavateLookSection.findMany({
            orderBy: [asc(menElavateLookSection.createdAt)],
        });

        return data;
    }

    async getAllMenelevateLooksections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menElavateLookSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menElavateLookSection.createdAt)],
            extras: {
                count: db
                    .$count(menElavateLookSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllMenelevateLooksection(id: string) {
        const data = await db.query.menElavateLookSection.findFirst({
            where: eq(menElavateLookSection.id, id),
        });

        return data;
    }

    async createMenelevateLooksection(
        values: createWomenBrandProduct & {
            imageUrl: string;
            title: string | null; // Make title nullable
        }
    ) {
        const data = await db
            .insert(menElavateLookSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateMenelevateLooksection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menElavateLookSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menElavateLookSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteMenelevateLooksection(id: string) {
        const data = await db
            .delete(menElavateLookSection)
            .where(eq(menElavateLookSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    //men middle section

    async getMenOutFitVarientSections(p0: { limit: number; page: number; }) {
        const data = await db.query.menMiddleBaannerSection.findMany({
            orderBy: [asc(menMiddleBaannerSection.createdAt)],
        });

        return data;
    }

    async getAllMenOutFitVarientSections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menMiddleBaannerSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menMiddleBaannerSection.createdAt)],
            extras: {
                count: db
                    .$count(menMiddleBaannerSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllMenOutFitVarientSection(id: string) {
        const data = await db.query.menMiddleBaannerSection.findFirst({
            where: eq(menMiddleBaannerSection.id, id),
        });

        return data;
    }

    async createMenOutFitVarientSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(menMiddleBaannerSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateMenOutFitVarientSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menMiddleBaannerSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menMiddleBaannerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteMenOutFitVarientSection(id: string) {
        const data = await db
            .delete(menMiddleBaannerSection)
            .where(eq(menMiddleBaannerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



    //men style direcftory section
      async getStyleDirectorySections(p0: { limit: number; page: number; }) {
        const data = await db.query.menstyleDirectory.findMany({
            orderBy: [asc(menstyleDirectory.createdAt)],
        });

        return data;
    }

    async getAllStyleDirectorySections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menstyleDirectory.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menstyleDirectory.createdAt)],
            extras: {
                count: db
                    .$count(menstyleDirectory)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllStyleDirectorySection(id: string) {
        const data = await db.query.menstyleDirectory.findFirst({
            where: eq(menstyleDirectory.id, id),
        });

        return data;
    }

    async createStyleDirectorySection(
        values: createWomenBrandProduct & {
            imageUrl: string;
            title: string | null; // Make title nullable
        }
    ) {
        const data = await db
            .insert(menstyleDirectory)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateStyleDirectorySection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menstyleDirectory)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menstyleDirectory.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteStyleDirectorySection(id: string) {
        const data = await db
            .delete(menstyleDirectory)
            .where(eq(menstyleDirectory.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


    //top-collection section

          async getTopCollectionSections(p0: { limit: number; page: number; }) {
        const data = await db.query.menTopCollection.findMany({
            orderBy: [asc(menTopCollection.createdAt)],
        });

        return data;
    }

    async getAllTopCollectionSections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menTopCollection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menTopCollection.createdAt)],
            extras: {
                count: db
                    .$count(menTopCollection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllTopCollectionSection(id: string) {
        const data = await db.query.menTopCollection.findFirst({
            where: eq(menTopCollection.id, id),
        });

        return data;
    }

    async createTopCollectionSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(menTopCollection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateTopCollectionSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menTopCollection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menTopCollection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteTopCollectionSection(id: string) {
        const data = await db
            .delete(menTopCollection)
            .where(eq(menTopCollection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


      //discount offer section

          async getDiscountOfferSections(p0: { limit: number; page: number; }) {
        const data = await db.query.menDiscountOfferSection.findMany({
            orderBy: [asc(menDiscountOfferSection.createdAt)],
        });

        return data;
    }

    async getAllDiscountOfferSections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menDiscountOfferSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menDiscountOfferSection.createdAt)],
            extras: {
                count: db
                    .$count(menDiscountOfferSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllDiscountOfferSection(id: string) {
        const data = await db.query.menDiscountOfferSection.findFirst({
            where: eq(menDiscountOfferSection.id, id),
        });

        return data;
    }

    async createDiscountOfferSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(menDiscountOfferSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateDiscountOfferSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menDiscountOfferSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menDiscountOfferSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteDiscountOfferSection(id: string) {
        const data = await db
            .delete(menDiscountOfferSection)
            .where(eq(menDiscountOfferSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    //suggested-looks

                async getSuggestedLooksForYous(p0: { limit: number; page: number; }) {
        const data = await db.query.menSuggestedLookForYou.findMany({
            orderBy: [asc(menSuggestedLookForYou.createdAt)],
        });

        return data;
    }

    async getAllSuggestedLooksForYous({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menSuggestedLookForYou.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menSuggestedLookForYou.createdAt)],
            extras: {
                count: db
                    .$count(menSuggestedLookForYou)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllSuggestedLooksForYou(id: string) {
        const data = await db.query.menSuggestedLookForYou.findFirst({
            where: eq(menSuggestedLookForYou.id, id),
        });

        return data;
    }

    async createSuggestedLooksForYou(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(menSuggestedLookForYou)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateSuggestedLooksForYou(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menSuggestedLookForYou)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menSuggestedLookForYou.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteSuggestedLooksForYou(id: string) {
        const data = await db
            .delete(menSuggestedLookForYou)
            .where(eq(menSuggestedLookForYou.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

       //suggested-looks

        async getMenNewCollections(p0: { limit: number; page: number; }) {
        const data = await db.query.menNewCollectionSectionn.findMany({
            orderBy: [asc(menNewCollectionSectionn.createdAt)],
        });

        return data;
    }

    async getAllMenNewCollections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menNewCollectionSectionn.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menNewCollectionSectionn.createdAt)],
            extras: {
                count: db
                    .$count(menNewCollectionSectionn)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllMenNewCollection(id: string) {
        const data = await db.query.menNewCollectionSectionn.findFirst({
            where: eq(menNewCollectionSectionn.id, id),
        });

        return data;
    }

    async createMenNewCollection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(menNewCollectionSectionn)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateMenNewCollection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menNewCollectionSectionn)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menNewCollectionSectionn.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteMenNewCollection(id: string) {
        const data = await db
            .delete(menNewCollectionSectionn)
            .where(eq(menNewCollectionSectionn.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


           //top-collection banner section

        async getWomenGetReadySection(p0: { limit: number; page: number; }) {
        const data = await db.query.womenGetReadySection.findMany({
            orderBy: [asc(womenGetReadySection.createdAt)],
        });

        return data;
    }

    async getWomenGetReadySections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenGetReadySection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenGetReadySection.createdAt)],
            extras: {
                count: db
                    .$count(womenGetReadySection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllWomenGetReadySection(id: string) {
        const data = await db.query.womenGetReadySection.findFirst({
            where: eq(womenGetReadySection.id, id),
        });

        return data;
    }

    async createWomenGetReadySection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenGetReadySection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateWomenGetReadySection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenGetReadySection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenGetReadySection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteWomenGetReadySection(id: string) {
        const data = await db
            .delete(womenGetReadySection)
            .where(eq(womenGetReadySection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


        async getmenStyleWithSubstanceMiddleSection() {
        const data = await db.query.menCuratedHerEssence.findMany({
            orderBy: [asc(menCuratedHerEssence.createdAt)],
                with: {
                  product: {
                    with: {
                      brand: true,
                      variants: true,
                      returnExchangePolicy: true,
                      specifications: true
                    }
                  }
                },
        });
          const mediaIds = new Set<string>();
          for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
              if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
              mediaIds.add(product.sustainabilityCertificate);
          }
          const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
          const mediaMap = new Map(mediaItems.data.map((item) => [item.id, item]));
          const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
              ...product,
              media: product.media.map((media) => ({
                ...media,
                mediaItem: mediaMap.get(media.id),
                url: mediaMap.get(media.id)?.url ?? null,
              })),
              sustainabilityCertificate: product.sustainabilityCertificate
                ? mediaMap.get(product.sustainabilityCertificate)
                : null,
              variants: product.variants.map((variant) => ({
                ...variant,
                mediaItem: variant.image ? mediaMap.get(variant.image) : null,
                url: variant.image ? mediaMap.get(variant.image)?.url ?? null : null,
              })),
              returnable: product.returnExchangePolicy?.returnable ?? false,
              returnDescription: product.returnExchangePolicy?.returnDescription ?? null,
              exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
              exchangeDescription: product.returnExchangePolicy?.exchangeDescription ?? null,
              specifications: product.specifications.map((spec) => ({
                key: spec.key,
                value: spec.value,
              })),
            },
          }));
          return enhancedData;

    }
        async getWomenStyleWithSubstanceMiddleSection() {
        const data = await db.query.womenStyleWithSubstanceMiddlePageSection.findMany({
            orderBy: [asc(womenStyleWithSubstanceMiddlePageSection.createdAt)],
                with: {
                  product: {
                    with: {
                      brand: true,
                      variants: true,
                      returnExchangePolicy: true,
                      specifications: true
                    }
                  }
                },
        });
          const mediaIds = new Set<string>();
          for (const { product } of data) {
            product.media.forEach((media) => mediaIds.add(media.id));
            product.variants.forEach((variant) => {
              if (variant.image) mediaIds.add(variant.image);
            });
            if (product.sustainabilityCertificate)
              mediaIds.add(product.sustainabilityCertificate);
          }
          const mediaItems = await mediaCache.getByIds(Array.from(mediaIds));
          const mediaMap = new Map(mediaItems.data.map((item) => [item.id, item]));
          const enhancedData = data.map(({ product, ...rest }) => ({
            ...rest,
            product: {
              ...product,
              media: product.media.map((media) => ({
                ...media,
                mediaItem: mediaMap.get(media.id),
                url: mediaMap.get(media.id)?.url ?? null,
              })),
              sustainabilityCertificate: product.sustainabilityCertificate
                ? mediaMap.get(product.sustainabilityCertificate)
                : null,
              variants: product.variants.map((variant) => ({
                ...variant,
                mediaItem: variant.image ? mediaMap.get(variant.image) : null,
                url: variant.image ? mediaMap.get(variant.image)?.url ?? null : null,
              })),
              returnable: product.returnExchangePolicy?.returnable ?? false,
              returnDescription: product.returnExchangePolicy?.returnDescription ?? null,
              exchangeable: product.returnExchangePolicy?.exchangeable ?? false,
              exchangeDescription: product.returnExchangePolicy?.exchangeDescription ?? null,
              specifications: product.specifications.map((spec) => ({
                key: spec.key,
                value: spec.value,
              })),
            },
          }));
          return enhancedData;

    }


         //new collection discount section

        async getnewCollectionDiscountSection(p0: { limit: number; page: number; }) {
        const data = await db.query.womenNewCollectionDiscountSection.findMany({
            orderBy: [asc(womenNewCollectionDiscountSection.createdAt)],
        });

        return data;
    }

    async getAllnewCollectionDiscount({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.womenNewCollectionDiscountSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(womenNewCollectionDiscountSection.createdAt)],
            extras: {
                count: db
                    .$count(womenNewCollectionDiscountSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getnewCollectionDiscount(id: string) {
        const data = await db.query.womenNewCollectionDiscountSection.findFirst({
            where: eq(womenNewCollectionDiscountSection.id, id),
        });

        return data;
    }

    async createnewCollectionDiscount(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(womenNewCollectionDiscountSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatenewCollectionDiscount(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(womenNewCollectionDiscountSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(womenNewCollectionDiscountSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletenewCollectionDiscount(id: string) {
        const data = await db
            .delete(womenNewCollectionDiscountSection)
            .where(eq(womenNewCollectionDiscountSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


         //get ready banner section

        async getMenTopcollections(p0: { limit: number; page: number; }) {
        const data = await db.query.menTopCollectionBanner.findMany({
            orderBy: [asc(menTopCollectionBanner.createdAt)],
        });

        return data;
    }

    async getAllMenTopcollections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menTopCollectionBanner.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menTopCollectionBanner.createdAt)],
            extras: {
                count: db
                    .$count(menTopCollectionBanner)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllMenTopcollection(id: string) {
        const data = await db.query.menTopCollectionBanner.findFirst({
            where: eq(menTopCollectionBanner.id, id),
        });

        return data;
    }

    async createMenTopcollection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(menTopCollectionBanner)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateMenTopcollection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menTopCollectionBanner)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menTopCollectionBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteMenTopcollection(id: string) {
        const data = await db
            .delete(menTopCollectionBanner)
            .where(eq(menTopCollectionBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



    //fresh ink collection


        async getMenFreshInkCollection(p0: { limit: number; page: number; }) {
        const data = await db.query.menFreshInkCollectionSection.findMany({
            orderBy: [asc(menFreshInkCollectionSection.createdAt)],
});

        return data;
    }



        //  kids banner section

    //     async getKidsBannerSections(p0: { limit: number; page: number; }) {
    //     const data = await db.query.kidHomeBannersSection.findMany({
    //         orderBy: [asc(kidHomeBannersSection.createdAt)],
    //     });

    //     return data;
    // }

    async getAllMenFreshInkCollections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menFreshInkCollectionSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menFreshInkCollectionSection.createdAt)],
            extras: {
                count: db
                    .$count(menFreshInkCollectionSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllMenFreshInkCollection(id: string) {
        const data = await db.query.menFreshInkCollectionSection.findFirst({
            where: eq(menFreshInkCollectionSection.id, id),
        });

        return data;
    }

    async createMenFreshInkCollection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(menFreshInkCollectionSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateMenFreshInkCollection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menFreshInkCollectionSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menFreshInkCollectionSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteMenFreshInkCollection(id: string) {
        const data = await db
            .delete(menFreshInkCollectionSection)
            .where(eq(menFreshInkCollectionSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



    //moodboardsection


        async getMenMoodBoardSection(p0: { limit: number; page: number; }) {
        const data = await db.query.menMoodBoardSection.findMany({
            orderBy: [asc(menMoodBoardSection.createdAt)],
        });

        return data;
    }

    async getAllMenMoodBoardSections({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.menMoodBoardSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(menMoodBoardSection.createdAt)],
            extras: {
                count: db
                    .$count(menMoodBoardSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getAllMenMoodBoardSection(id: string) {
        const data = await db.query.menMoodBoardSection.findFirst({
            where: eq(menMoodBoardSection.id, id),
        });

        return data;
    }

    async createMenMoodBoardSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(menMoodBoardSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateMenMoodBoardSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(menMoodBoardSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(menMoodBoardSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteMenMoodBoardSection(id: string) {
        const data = await db
            .delete(menMoodBoardSection)
            .where(eq(menMoodBoardSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

//kids banner section


   async getKidsBannerSections(p0: { limit: number; page: number; }) {
        const data = await db.query.kidHomeBannersSection.findMany({
            orderBy: [asc(kidHomeBannersSection.createdAt)],
        });

        return data;
    }

    async getAllKidsBannerSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.kidHomeBannersSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(kidHomeBannersSection.createdAt)],
            extras: {
                count: db
                    .$count(kidHomeBannersSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getKidsBannerSection(id: string) {
        const data = await db.query.kidHomeBannersSection.findFirst({
            where: eq(kidHomeBannersSection.id, id),
        });

        return data;
    }

    async createKidsBannerSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(kidHomeBannersSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateKidsBannerSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(kidHomeBannersSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(kidHomeBannersSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteKidsBannerSection(id: string) {
        const data = await db
            .delete(kidHomeBannersSection)
            .where(eq(kidHomeBannersSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


    //kids explore categories section


       async getKidsExploreCategorySections(p0: { limit: number; page: number; }) {
        const data = await db.query.kidExploreCategory.findMany({
            orderBy: [asc(kidExploreCategory.createdAt)],
        });

        return data;
    }

    async getAllKidsExploreCategorySection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.kidExploreCategory.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(kidExploreCategory.createdAt)],
            extras: {
                count: db
                    .$count(kidExploreCategory)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getKidsExploreCategorySection(id: string) {
        const data = await db.query.kidExploreCategory.findFirst({
            where: eq(kidExploreCategory.id, id),
        });

        return data;
    }

    async createKidsExploreCategorySection(
        values: createWomenBrandProduct & {
            imageUrl: string;
            title: string | null; // Make title nullable
        }
    ) {
        const data = await db
            .insert(kidExploreCategory)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateKidsExploreCategorySection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(kidExploreCategory)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(kidExploreCategory.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteKidsExploreCategorySection(id: string) {
        const data = await db
            .delete(kidExploreCategory)
            .where(eq(kidExploreCategory.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


//kids specual care section
        async getKidsCareSections(p0: { limit: number; page: number; }) {
        const data = await db.query.kidSpecialCareSection.findMany({
            orderBy: [asc(kidSpecialCareSection.createdAt)],
        });

        return data;
    }

    async getAllKidsCareSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.kidSpecialCareSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(kidSpecialCareSection.createdAt)],
            extras: {
                count: db
                    .$count(kidSpecialCareSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getKidsCareSection(id: string) {
        const data = await db.query.kidSpecialCareSection.findFirst({
            where: eq(kidSpecialCareSection.id, id),
        });

        return data;
    }

    async createKidsCareSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(kidSpecialCareSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateKidsCareSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(kidSpecialCareSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(kidSpecialCareSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteKidsCareSection(id: string) {
        const data = await db
            .delete(kidSpecialCareSection)
            .where(eq(kidSpecialCareSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }






    //kids specual care section
        async getkidElevateSections(p0: { limit: number; page: number; }) {
        const data = await db.query.kidElavateLookSection.findMany({
            orderBy: [asc(kidElavateLookSection.createdAt)],
        });

        return data;
    }

    async getAllkidElevateSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.kidElavateLookSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(kidElavateLookSection.createdAt)],
            extras: {
                count: db
                    .$count(kidElavateLookSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getkidElevateSection(id: string) {
        const data = await db.query.kidElavateLookSection.findFirst({
            where: eq(kidElavateLookSection.id, id),
        });

        return data;
    }

    async createkidElevateSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(kidElavateLookSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatekidElevateSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(kidElavateLookSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(kidElavateLookSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletekidElevateSection(id: string) {
        const data = await db
            .delete(kidElavateLookSection)
            .where(eq(kidElavateLookSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }






    //kids specual care section

        async getkidDiscountOfferSections(p0: { limit: number; page: number; }) {
        const data = await db.query.kidsDiscountOfferSection.findMany({
            orderBy: [asc(kidsDiscountOfferSection.createdAt)],
        });

        return data;
    }

    async getAllkidDiscountOfferSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.kidsDiscountOfferSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(kidsDiscountOfferSection.createdAt)],
            extras: {
                count: db
                    .$count(kidsDiscountOfferSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getkidDiscountOfferSection(id: string) {
        const data = await db.query.kidsDiscountOfferSection.findFirst({
            where: eq(kidsDiscountOfferSection.id, id),
        });

        return data;
    }

    async createkidDiscountOfferSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(kidsDiscountOfferSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatekidDiscountOfferSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(kidsDiscountOfferSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(kidsDiscountOfferSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletekidDiscountOfferSection(id: string) {
        const data = await db
            .delete(kidsDiscountOfferSection)
            .where(eq(kidsDiscountOfferSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }






     //kids mom twining section

        async getkidDollTwiningSections(p0: { limit: number; page: number; }) {
        const data = await db.query.kidsTwiningMomSection.findMany({
            orderBy: [asc(kidsTwiningMomSection.createdAt)],
        });

        return data;
    }

    async getAllkidDollTwiningSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.kidsTwiningMomSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(kidsTwiningMomSection.createdAt)],
            extras: {
                count: db
                    .$count(kidsTwiningMomSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getkidDollTwiningSection(id: string) {
        const data = await db.query.kidsTwiningMomSection.findFirst({
            where: eq(kidsTwiningMomSection.id, id),
        });

        return data;
    }

    async createkidDollTwiningSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(kidsTwiningMomSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatekidDollTwiningSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(kidsTwiningMomSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(kidsTwiningMomSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletekidDollTwiningSection(id: string) {
        const data = await db
            .delete(kidsTwiningMomSection)
            .where(eq(kidsTwiningMomSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


    //kid doll buying section


            async getkidDollBuyingSections(p0: { limit: number; page: number; }) {
        const data = await db.query.kidsDollBuyingSectionn.findMany({
            orderBy: [asc(kidsDollBuyingSectionn.createdAt)],
        });

        return data;
    }

    async getAllkidDollBuyingSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.kidsDollBuyingSectionn.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(kidsDollBuyingSectionn.createdAt)],
            extras: {
                count: db
                    .$count(kidsDollBuyingSectionn)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getkidDollBuyingSection(id: string) {
        const data = await db.query.kidsDollBuyingSectionn.findFirst({
            where: eq(kidsDollBuyingSectionn.id, id),
        });

        return data;
    }

    async createkidDollBuyingSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(kidsDollBuyingSectionn)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatekidDollBuyingSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(kidsDollBuyingSectionn)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(kidsDollBuyingSectionn.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletekidDollBuyingSection(id: string) {
        const data = await db
            .delete(kidsDollBuyingSectionn)
            .where(eq(kidsDollBuyingSectionn.id, id))
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
