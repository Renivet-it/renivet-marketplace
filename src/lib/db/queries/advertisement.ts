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
    kidsTwiningMomSection,
    homeAndLivingBrandSection,
    homeAndLivingEcoBanner,
    homeAndLivingBannerMiddle,
    homeAndLivingTopPicks,
    homeAndLivingNewCollectionSection,
    homeAndLivingexploreCategorySection,
    homeandLivingBanner,
    homeAndLivingCurateConciousSection,
    beautyBannerSection,
    beautyExploreCategorySection,
    beautySkinBannerSection,
    beautyCareRoutineSection,
    beautyNurtureSection,
    beautyDiscountSection,
    beautBestSellerSection,
    beautMindFulSection,
    beautySkinQuizSection,
    homePageAboutUsTrsutedBanner,
    homeNewInstaBannerSection,
    homeNewArtisanSection,
    homeSwapBannerSection,
    homeMakeFirstClick,
    homeMatchingBanner,
    homeBrandIntroductionBanner,
    kidGentleCareOthers,
    kidForstGiraffeOthers,
    homeEffortlessEleganceSection,
    homeEventBannerSectionOne

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



      async getkidGentleCareSections(p0: { limit: number; page: number; }) {
        const data = await db.query.kidGentleCareOthers.findMany({
            orderBy: [asc(kidGentleCareOthers.createdAt)],
        });

        return data;
    }

    async getAllkidGentleCareSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.kidGentleCareOthers.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(kidGentleCareOthers.createdAt)],
            extras: {
                count: db
                    .$count(kidGentleCareOthers)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getkidGentleCareSection(id: string) {
        const data = await db.query.kidGentleCareOthers.findFirst({
            where: eq(kidGentleCareOthers.id, id),
        });

        return data;
    }

    async createkidGentleCareSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(kidGentleCareOthers)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatekidGentleCareSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(kidGentleCareOthers)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(kidGentleCareOthers.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletekidGentleCareSection(id: string) {
        const data = await db
            .delete(kidGentleCareOthers)
            .where(eq(kidGentleCareOthers.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



          async getkidFrostyFormalShirtSections(p0: { limit: number; page: number; }) {
        const data = await db.query.kidForstGiraffeOthers.findMany({
            orderBy: [asc(kidForstGiraffeOthers.createdAt)],
        });

        return data;
    }

    async getAllkidFrostyFormalShirtSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.kidForstGiraffeOthers.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(kidForstGiraffeOthers.createdAt)],
            extras: {
                count: db
                    .$count(kidForstGiraffeOthers)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getkidFrostyFormalShirtSection(id: string) {
        const data = await db.query.kidForstGiraffeOthers.findFirst({
            where: eq(kidForstGiraffeOthers.id, id),
        });

        return data;
    }

    async createkidFrostyFormalShirtSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(kidForstGiraffeOthers)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatekidFrostyFormalShirtSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(kidForstGiraffeOthers)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(kidForstGiraffeOthers.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletekidFrostyFormalShirtSection(id: string) {
        const data = await db
            .delete(kidForstGiraffeOthers)
            .where(eq(kidForstGiraffeOthers.id, id))
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

        async getkidDolllTwiningSections(p0: { limit: number; page: number; }) {
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



    //   //home and living banner section


            async gethomeAndLivingSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeandLivingBanner.findMany({
            orderBy: [asc(homeandLivingBanner.createdAt)],
        });

        return data;
    }

    async getAllhomeAndLivingSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeandLivingBanner.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeandLivingBanner.createdAt)],
            extras: {
                count: db
                    .$count(homeandLivingBanner)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async gethomeAndLivingSection(id: string) {
        const data = await db.query.homeandLivingBanner.findFirst({
            where: eq(homeandLivingBanner.id, id),
        });

        return data;
    }

    async createhomeAndLivingSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeandLivingBanner)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatehomeAndLivingSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeandLivingBanner)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeandLivingBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletehomeAndLivingSection(id: string) {
        const data = await db
            .delete(homeandLivingBanner)
            .where(eq(homeandLivingBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



       //   //home and living explore category section


            async gethomeAndLivingCategoryExploreSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeAndLivingexploreCategorySection.findMany({
            orderBy: [asc(homeAndLivingexploreCategorySection.createdAt)],
        });

        return data;
    }

    async getAllhomeAndLivingCategoryExploreSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeAndLivingexploreCategorySection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeAndLivingexploreCategorySection.createdAt)],
            extras: {
                count: db
                    .$count(homeAndLivingexploreCategorySection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async gethomeAndLivingCategoryExploreSection(id: string) {
        const data = await db.query.homeAndLivingexploreCategorySection.findFirst({
            where: eq(homeAndLivingexploreCategorySection.id, id),
        });

        return data;
    }

    async createhomeAndLivingCategoryExploreSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
            title: string | null; // Make title nullable
        }
    ) {
        const data = await db
            .insert(homeAndLivingexploreCategorySection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatehomeAndLivingCategoryExploreSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeAndLivingexploreCategorySection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeAndLivingexploreCategorySection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletehomeAndLivingCategoryExploreSection(id: string) {
        const data = await db
            .delete(homeAndLivingexploreCategorySection)
            .where(eq(homeAndLivingexploreCategorySection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }







        //   //home and living explore category section


            async gethomeAndLivingCurateConciousSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeAndLivingCurateConciousSection.findMany({
            orderBy: [asc(homeAndLivingCurateConciousSection.createdAt)],
        });

        return data;
    }

    async getAllhomeAndLivingCurateConciousSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeAndLivingCurateConciousSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeAndLivingCurateConciousSection.createdAt)],
            extras: {
                count: db
                    .$count(homeAndLivingCurateConciousSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async gethomeAndLivingCurateConciousSection(id: string) {
        const data = await db.query.homeAndLivingCurateConciousSection.findFirst({
            where: eq(homeAndLivingCurateConciousSection.id, id),
        });

        return data;
    }

    async createhomeAndLivingCurateConciousSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
            title: string | null; // Make title nullable
        }
    ) {
        const data = await db
            .insert(homeAndLivingCurateConciousSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatehomeAndLivingCurateConciousSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeAndLivingCurateConciousSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeAndLivingCurateConciousSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletehomeAndLivingCurateConciousSection(id: string) {
        const data = await db
            .delete(homeAndLivingCurateConciousSection)
            .where(eq(homeAndLivingCurateConciousSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    // home and living new collection//




    async gethomeAndLivingNewCollectionSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeAndLivingNewCollectionSection.findMany({
            orderBy: [asc(homeAndLivingNewCollectionSection.createdAt)],
        });

        return data;
    }

    async getAllhomeAndLivingNewCollectionSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeAndLivingNewCollectionSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeAndLivingNewCollectionSection.createdAt)],
            extras: {
                count: db
                    .$count(homeAndLivingNewCollectionSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async gethomeAndLivingNewCollectionSection(id: string) {
        const data = await db.query.homeAndLivingNewCollectionSection.findFirst({
            where: eq(homeAndLivingNewCollectionSection.id, id),
        });

        return data;
    }

    async createhomeAndLivingNewCollectionSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeAndLivingNewCollectionSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatehomeAndLivingNewCollectionSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeAndLivingNewCollectionSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeAndLivingNewCollectionSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletehomeAndLivingNewCollectionSection(id: string) {
        const data = await db
            .delete(homeAndLivingNewCollectionSection)
            .where(eq(homeAndLivingNewCollectionSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



       // home and living new collection//




    async gethomeAndLivingTopPickSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeAndLivingTopPicks.findMany({
            orderBy: [asc(homeAndLivingTopPicks.createdAt)],
        });

        return data;
    }

    async getAllhomeAndLivingTopPickSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeAndLivingTopPicks.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeAndLivingTopPicks.createdAt)],
            extras: {
                count: db
                    .$count(homeAndLivingTopPicks)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async gethomeAndLivingTopPickSection(id: string) {
        const data = await db.query.homeAndLivingTopPicks.findFirst({
            where: eq(homeAndLivingTopPicks.id, id),
        });

        return data;
    }

    async createhomeAndLivingTopPickSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeAndLivingTopPicks)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatehomeAndLivingTopPickSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeAndLivingTopPicks)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeAndLivingTopPicks.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletehomeAndLivingTopPickSection(id: string) {
        const data = await db
            .delete(homeAndLivingTopPicks)
            .where(eq(homeAndLivingTopPicks.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



           // home and living new collection//




    async gethomeAndLivingBannerMiddleSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeAndLivingBannerMiddle.findMany({
            orderBy: [asc(homeAndLivingBannerMiddle.createdAt)],
        });

        return data;
    }

    async getAllhomeAndLivingBannerMiddleSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeAndLivingBannerMiddle.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeAndLivingBannerMiddle.createdAt)],
            extras: {
                count: db
                    .$count(homeAndLivingBannerMiddle)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async gethomeAndLivingBannerMiddleSection(id: string) {
        const data = await db.query.homeAndLivingBannerMiddle.findFirst({
            where: eq(homeAndLivingBannerMiddle.id, id),
        });

        return data;
    }

    async createhomeAndLivingBannerMiddleSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeAndLivingBannerMiddle)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatehomeAndLivingBannerMiddleSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeAndLivingBannerMiddle)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeAndLivingBannerMiddle.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletehomeAndLivingBannerMiddleSection(id: string) {
        const data = await db
            .delete(homeAndLivingBannerMiddle)
            .where(eq(homeAndLivingBannerMiddle.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


//homeAndLivingEcoBanner


    async gethomeAndLivingEcoBanners(p0: { limit: number; page: number; }) {
        const data = await db.query.homeAndLivingEcoBanner.findMany({
            orderBy: [asc(homeAndLivingEcoBanner.createdAt)],
        });

        return data;
    }

    async getAllhomeAndLivingEcoBanner({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeAndLivingEcoBanner.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeAndLivingEcoBanner.createdAt)],
            extras: {
                count: db
                    .$count(homeAndLivingEcoBanner)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async gethomeAndLivingEcoBanner(id: string) {
        const data = await db.query.homeAndLivingEcoBanner.findFirst({
            where: eq(homeAndLivingEcoBanner.id, id),
        });

        return data;
    }

    async createhomeAndLivingEcoBanner(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeAndLivingEcoBanner)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatehomeAndLivingEcoBanner(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeAndLivingEcoBanner)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeAndLivingEcoBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletehomeAndLivingEcoBanner(id: string) {
        const data = await db
            .delete(homeAndLivingEcoBanner)
            .where(eq(homeAndLivingEcoBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



    async gethomeAndLivingBrandSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeAndLivingBrandSection.findMany({
            orderBy: [asc(homeAndLivingBrandSection.createdAt)],
        });

        return data;
    }

    async getAllhomeAndLivingBrandSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeAndLivingBrandSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeAndLivingBrandSection.createdAt)],
            extras: {
                count: db
                    .$count(homeAndLivingBrandSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async gethomeAndLivingBrandSection(id: string) {
        const data = await db.query.homeAndLivingBrandSection.findFirst({
            where: eq(homeAndLivingBrandSection.id, id),
        });

        return data;
    }

    async createhomeAndLivingBrandSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeAndLivingBrandSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updatehomeAndLivingBrandSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeAndLivingBrandSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeAndLivingBrandSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deletehomeAndLivingBrandSection(id: string) {
        const data = await db
            .delete(homeAndLivingBrandSection)
            .where(eq(homeAndLivingBrandSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



    //beauty-section//


        async getBeautyPersonalSections(p0: { limit: number; page: number; }) {
        const data = await db.query.beautyBannerSection.findMany({
            orderBy: [asc(beautyBannerSection.createdAt)],
        });

        return data;
    }

    async getAllBeautyPersonalSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.beautyBannerSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(beautyBannerSection.createdAt)],
            extras: {
                count: db
                    .$count(beautyBannerSection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBeautyPersonalSection(id: string) {
        const data = await db.query.beautyBannerSection.findFirst({
            where: eq(beautyBannerSection.id, id),
        });

        return data;
    }

    async createBeautyPersonalSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(beautyBannerSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBeautyPersonalSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(beautyBannerSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(beautyBannerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBeautyPersonalSection(id: string) {
        const data = await db
            .delete(beautyBannerSection)
            .where(eq(beautyBannerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



        async getBeautyExploreCategorySections(p0: { limit: number; page: number; }) {
        const data = await db.query.beautyExploreCategorySection.findMany({
            orderBy: [asc(beautyExploreCategorySection.createdAt)],
        });

        return data;
    }

    async getAllBeautyExploreCategorySection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.beautyExploreCategorySection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(beautyExploreCategorySection.createdAt)],
            extras: {
                count: db
                    .$count(beautyExploreCategorySection)
                    .as("home_shop_by_category_count"),
            },
        });

        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBeautyExploreCategorySection(id: string) {
        const data = await db.query.beautyExploreCategorySection.findFirst({
            where: eq(beautyExploreCategorySection.id, id),
        });

        return data;
    }

    async createBeautyExploreCategorySection(
        values: createWomenBrandProduct & {
            imageUrl: string;
            title: string | null; // Make title nullable
        }
    ) {
        const data = await db
            .insert(beautyExploreCategorySection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBeautyExploreCategorySection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(beautyExploreCategorySection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(beautyExploreCategorySection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBeautyExploreCategorySection(id: string) {
        const data = await db
            .delete(beautyExploreCategorySection)
            .where(eq(beautyExploreCategorySection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }








        async getBeautySkinBannerSections(p0: { limit: number; page: number; }) {
        const data = await db.query.beautySkinBannerSection.findMany({
            orderBy: [asc(beautySkinBannerSection.createdAt)],
        });

        return data;
    }

    async getAllBeautySkinBannerSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.beautySkinBannerSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(beautySkinBannerSection.createdAt)],
            extras: {
                count: db
                    .$count(beautySkinBannerSection)
                    .as("home_shop_by_category_count"),
            },
        });

        // @ts-ignore
        const parsed = beautySkinBannerSection.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBeautySkinBannerSection(id: string) {
        const data = await db.query.beautySkinBannerSection.findFirst({
            where: eq(beautySkinBannerSection.id, id),
        });

        return data;
    }

    async createBeautySkinBannerSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(beautySkinBannerSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBeautySkinBannerSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(beautySkinBannerSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(beautySkinBannerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBeautySkinBannerSection(id: string) {
        const data = await db
            .delete(beautySkinBannerSection)
            .where(eq(beautySkinBannerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }




      async getBeautyCareRoutinetions(p0: { limit: number; page: number; }) {
        const data = await db.query.beautyCareRoutineSection.findMany({
            orderBy: [asc(beautyCareRoutineSection.createdAt)],
        });

        return data;
    }

    async getAllBeautyCareRoutineSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.beautyCareRoutineSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(beautyCareRoutineSection.createdAt)],
            extras: {
                count: db
                    .$count(beautyCareRoutineSection)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBeautyCareRoutinetion(id: string) {
        const data = await db.query.beautyCareRoutineSection.findFirst({
            where: eq(beautyCareRoutineSection.id, id),
        });

        return data;
    }

    async createBeautyCareRoutineSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
            title: string | null; // Make title nullable
        }
    ) {
        const data = await db
            .insert(beautyCareRoutineSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBeautyCareRoutineSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(beautyCareRoutineSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(beautyCareRoutineSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBeautyCareRoutineSection(id: string) {
        const data = await db
            .delete(beautyCareRoutineSection)
            .where(eq(beautyCareRoutineSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }




          async getBeautyNurtureSections(p0: { limit: number; page: number; }) {
        const data = await db.query.beautyNurtureSection.findMany({
            orderBy: [asc(beautyNurtureSection.createdAt)],
        });

        return data;
    }

    async getAllBeautyNurtureSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.beautyNurtureSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(beautyNurtureSection.createdAt)],
            extras: {
                count: db
                    .$count(beautyNurtureSection)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBeautyNurtureSection(id: string) {
        const data = await db.query.beautyNurtureSection.findFirst({
            where: eq(beautyNurtureSection.id, id),
        });

        return data;
    }

    async createBeautyNurtureSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(beautyNurtureSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBeautyNurtureSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(beautyNurtureSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(beautyNurtureSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBeautyNurtureSection(id: string) {
        const data = await db
            .delete(beautyNurtureSection)
            .where(eq(beautyNurtureSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }




      async getBeautyDiscountSections(p0: { limit: number; page: number; }) {
        const data = await db.query.beautyDiscountSection.findMany({
            orderBy: [asc(beautyDiscountSection.createdAt)],
        });

        return data;
    }

    async getAllBeautyDiscountSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.beautyDiscountSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(beautyDiscountSection.createdAt)],
            extras: {
                count: db
                    .$count(beautyDiscountSection)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBeautyDiscountSection(id: string) {
        const data = await db.query.beautyDiscountSection.findFirst({
            where: eq(beautyDiscountSection.id, id),
        });

        return data;
    }

    async createBeautyDiscountSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(beautyDiscountSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBeautyDiscountSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(beautyDiscountSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(beautyDiscountSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBeautyDiscountSection(id: string) {
        const data = await db
            .delete(beautyDiscountSection)
            .where(eq(beautyDiscountSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }






      async getBeautyBestSellerSections(p0: { limit: number; page: number; }) {
        const data = await db.query.beautBestSellerSection.findMany({
            orderBy: [asc(beautBestSellerSection.createdAt)],
        });

        return data;
    }

    async getAllBeautyBestSellerSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.beautBestSellerSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(beautBestSellerSection.createdAt)],
            extras: {
                count: db
                    .$count(beautBestSellerSection)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBeautyBestSellerSection(id: string) {
        const data = await db.query.beautBestSellerSection.findFirst({
            where: eq(beautBestSellerSection.id, id),
        });

        return data;
    }

    async createBeautyBestSellerSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(beautBestSellerSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBeautyBestSellerSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(beautBestSellerSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(beautBestSellerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBeautyBestSellerSection(id: string) {
        const data = await db
            .delete(beautBestSellerSection)
            .where(eq(beautBestSellerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }





       async getBeautyMindFulSections(p0: { limit: number; page: number; }) {
        const data = await db.query.beautMindFulSection.findMany({
            orderBy: [asc(beautMindFulSection.createdAt)],
        });

        return data;
    }

    async getAllBeautyMindFulSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.beautMindFulSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(beautMindFulSection.createdAt)],
            extras: {
                count: db
                    .$count(beautMindFulSection)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBeautyMindFulSection(id: string) {
        const data = await db.query.beautMindFulSection.findFirst({
            where: eq(beautMindFulSection.id, id),
        });

        return data;
    }

    async createBeautyMindFulSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(beautMindFulSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBeautyMindFulSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(beautMindFulSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(beautMindFulSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBeautyMindFulSection(id: string) {
        const data = await db
            .delete(beautMindFulSection)
            .where(eq(beautMindFulSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



       async getBeautySkinQuizections(p0: { limit: number; page: number; }) {
        const data = await db.query.beautySkinQuizSection.findMany({
            orderBy: [asc(beautySkinQuizSection.createdAt)],
        });

        return data;
    }

    async getAllBeautySkinQuizection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.beautySkinQuizSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(beautySkinQuizSection.createdAt)],
            extras: {
                count: db
                    .$count(beautySkinQuizSection)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getBeautySkinQuizection(id: string) {
        const data = await db.query.beautySkinQuizSection.findFirst({
            where: eq(beautySkinQuizSection.id, id),
        });

        return data;
    }

    async createBeautySkinQuizection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(beautySkinQuizSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateBeautySkinQuizection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(beautySkinQuizSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(beautySkinQuizSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteBeautySkinQuizection(id: string) {
        const data = await db
            .delete(beautySkinQuizSection)
            .where(eq(beautySkinQuizSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


//new-home-page


       async getHomePageTrustedSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homePageAboutUsTrsutedBanner.findMany({
            orderBy: [asc(homePageAboutUsTrsutedBanner.createdAt)],
        });

        return data;
    }

    async getAllHomePageTrustedSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homePageAboutUsTrsutedBanner.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homePageAboutUsTrsutedBanner.createdAt)],
            extras: {
                count: db
                    .$count(homePageAboutUsTrsutedBanner)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomePageTrustedSection(id: string) {
        const data = await db.query.homePageAboutUsTrsutedBanner.findFirst({
            where: eq(homePageAboutUsTrsutedBanner.id, id),
        });

        return data;
    }

    async createHomePageTrustedSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homePageAboutUsTrsutedBanner)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomePageTrustedSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homePageAboutUsTrsutedBanner)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homePageAboutUsTrsutedBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomePageTrustedSection(id: string) {
        const data = await db
            .delete(homePageAboutUsTrsutedBanner)
            .where(eq(homePageAboutUsTrsutedBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }




           async getHomePageBrandIntroductionSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeBrandIntroductionBanner.findMany({
            orderBy: [asc(homeBrandIntroductionBanner.createdAt)],
        });

        return data;
    }

    async getAllHomePageBrandIntroductionSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeBrandIntroductionBanner.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeBrandIntroductionBanner.createdAt)],
            extras: {
                count: db
                    .$count(homeBrandIntroductionBanner)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomePageBrandIntroductionSection(id: string) {
        const data = await db.query.homeBrandIntroductionBanner.findFirst({
            where: eq(homeBrandIntroductionBanner.id, id),
        });

        return data;
    }

    async createHomePageBrandIntroductionSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
           title: string | null; // Make title nullable
        }
    ) {
        const data = await db
            .insert(homeBrandIntroductionBanner)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomePageBrandIntroductionSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeBrandIntroductionBanner)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeBrandIntroductionBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomePageBrandIntroductionSection(id: string) {
        const data = await db
            .delete(homeBrandIntroductionBanner)
            .where(eq(homeBrandIntroductionBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }



    //
       async getHomePageMatchingSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeMatchingBanner.findMany({
            orderBy: [asc(homeMatchingBanner.createdAt)],
        });

        return data;
    }

    async getAllHomePageMatchingSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeMatchingBanner.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeMatchingBanner.createdAt)],
            extras: {
                count: db
                    .$count(homeMatchingBanner)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomePageMatchingSection(id: string) {
        const data = await db.query.homeMatchingBanner.findFirst({
            where: eq(homeMatchingBanner.id, id),
        });

        return data;
    }

    async createHomePageMatchingSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeMatchingBanner)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomePageMatchingSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeMatchingBanner)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeMatchingBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomePageMatchingSection(id: string) {
        const data = await db
            .delete(homeMatchingBanner)
            .where(eq(homeMatchingBanner.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }




         async getHomePageFirstConciousClickSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeMakeFirstClick.findMany({
            orderBy: [asc(homeMakeFirstClick.createdAt)],
        });

        return data;
    }

    async getAllHomePageFirstConciousClickSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeMakeFirstClick.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeMakeFirstClick.createdAt)],
            extras: {
                count: db
                    .$count(homeMakeFirstClick)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomePageFirstConciousClickSection(id: string) {
        const data = await db.query.homeMakeFirstClick.findFirst({
            where: eq(homeMakeFirstClick.id, id),
        });

        return data;
    }

    async createHomePageFirstConciousClickSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeMakeFirstClick)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomePageFirstConciousClickSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeMakeFirstClick)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeMakeFirstClick.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomePageFirstConciousClickSection(id: string) {
        const data = await db
            .delete(homeMakeFirstClick)
            .where(eq(homeMakeFirstClick.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }






         async getHomePageSwapBannerSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeSwapBannerSection.findMany({
            orderBy: [asc(homeSwapBannerSection.createdAt)],
        });

        return data;
    }

    async getAllHomePageSwapBannerSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeSwapBannerSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeSwapBannerSection.createdAt)],
            extras: {
                count: db
                    .$count(homeSwapBannerSection)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomePageSwapBannerSection(id: string) {
        const data = await db.query.homeSwapBannerSection.findFirst({
            where: eq(homeSwapBannerSection.id, id),
        });

        return data;
    }

    async createHomePageSwapBannerSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeSwapBannerSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomePageSwapBannerSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeSwapBannerSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeSwapBannerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomePageSwapBannerSection(id: string) {
        const data = await db
            .delete(homeSwapBannerSection)
            .where(eq(homeSwapBannerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }






async getHomePageNewArtisanSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeNewArtisanSection.findMany({
            orderBy: [asc(homeNewArtisanSection.createdAt)],
        });

        return data;
    }

    async getAllHomePageNewArtisanSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeNewArtisanSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeNewArtisanSection.createdAt)],
            extras: {
                count: db
                    .$count(homeNewArtisanSection)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomePageNewArtisanSection(id: string) {
        const data = await db.query.homeNewArtisanSection.findFirst({
            where: eq(homeNewArtisanSection.id, id),
        });

        return data;
    }

    async createHomePageNewArtisanSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeNewArtisanSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomePageNewArtisanSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeNewArtisanSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeNewArtisanSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomePageNewArtisanSection(id: string) {
        const data = await db
            .delete(homeNewArtisanSection)
            .where(eq(homeNewArtisanSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


    async getHomePageInsaBannerSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeNewInstaBannerSection.findMany({
            orderBy: [asc(homeNewInstaBannerSection.createdAt)],
        });

        return data;
    }

    async getAllHomePageInsaBannerSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeNewInstaBannerSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeNewInstaBannerSection.createdAt)],
            extras: {
                count: db
                    .$count(homeNewInstaBannerSection)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomePageInsaBannerSection(id: string) {
        const data = await db.query.homeNewInstaBannerSection.findFirst({
            where: eq(homeNewInstaBannerSection.id, id),
        });

        return data;
    }

    async createHomePageInsaBannerSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeNewInstaBannerSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomePageInsaBannerSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeNewInstaBannerSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeNewInstaBannerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomePageInsaBannerSection(id: string) {
        const data = await db
            .delete(homeNewInstaBannerSection)
            .where(eq(homeNewInstaBannerSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }
        async getHomePageEffortlessEleganceSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeEffortlessEleganceSection.findMany({
            orderBy: [asc(homeEffortlessEleganceSection.createdAt)],
        });

        return data;
    }

    async getAllHomePageEffortlessEleganceSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeEffortlessEleganceSection.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeEffortlessEleganceSection.createdAt)],
            extras: {
                count: db
                    .$count(homeEffortlessEleganceSection)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomePageEffortlessEleganceSection(id: string) {
        const data = await db.query.homeEffortlessEleganceSection.findFirst({
            where: eq(homeEffortlessEleganceSection.id, id),
        });

        return data;
    }

    async createHomePageEffortlessEleganceSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeEffortlessEleganceSection)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomePageEffortlessEleganceSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeEffortlessEleganceSection)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeEffortlessEleganceSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomePageEffortlessEleganceSection(id: string) {
        const data = await db
            .delete(homeEffortlessEleganceSection)
            .where(eq(homeEffortlessEleganceSection.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }


//event-section
      async getHomePageEventOneSections(p0: { limit: number; page: number; }) {
        const data = await db.query.homeEventBannerSectionOne.findMany({
            orderBy: [asc(homeEventBannerSectionOne.createdAt)],
        });

        return data;
    }

    async getAllHomePageEventOneSection({
        limit,
        page,
    }: {
        limit: number;
        page: number;
        search?: string;
    }) {
        const data = await db.query.homeEventBannerSectionOne.findMany({
            limit,
            offset: (page - 1) * limit,
            orderBy: [asc(homeEventBannerSectionOne.createdAt)],
            extras: {
                count: db
                    .$count(homeEventBannerSectionOne)
                    .as("home_shop_by_category_count"),
            },
        });
        const parsed = homeShopByCategorySchema.array().parse(data);

        return {
            data: parsed,
            count: +data?.[0]?.count || 0,
        };
    }

    async getHomePageEventOneSection(id: string) {
        const data = await db.query.homeEventBannerSectionOne.findFirst({
            where: eq(homeEventBannerSectionOne.id, id),
        });

        return data;
    }

    async createHomePageEventOneSection(
        values: createWomenBrandProduct & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .insert(homeEventBannerSectionOne)
            .values(values)
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async updateHomePageEventOneSection(
        id: string,
        values: UpdateHomeShopByCategory & {
            imageUrl: string;
        }
    ) {
        const data = await db
            .update(homeEventBannerSectionOne)
            .set({
                ...values,
                updatedAt: new Date(),
            })
            .where(eq(homeEventBannerSectionOne.id, id))
            .returning()
            .then((res) => res[0]);

        return data;
    }

    async deleteHomePageEventOneSection(id: string) {
        const data = await db
            .delete(homeEventBannerSectionOne)
            .where(eq(homeEventBannerSectionOne.id, id))
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
            title: string | null;
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
