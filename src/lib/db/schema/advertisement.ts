import {
    boolean,
    index,
    integer,
    pgTable,
    text,
    uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../helper";

export const advertisements = pgTable(
    "advertisements",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        title: text("title").notNull(),
        description: text("description"),
        imageUrl: text("image_url").notNull(),
        url: text("url"),
        position: integer("position").notNull().default(0),
        height: integer("height").notNull().default(100),
        isPublished: boolean("is_published").notNull().default(false),
        ...timestamps,
    },
    (table) => ({
        advertisementPositionIdx: index("advertisement_position_idx").on(
            table.position
        ),
    })
);

export const homeBrandProducts = pgTable(
    "home_brand_products",
    {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
        imageUrl: text("image_url").notNull(),
        url: text("url"),
        position: integer("position").notNull().default(0),
        ...timestamps,
    },
    (table) => ({
        homeBrandProductPositionIdx: index(
            "home_brand_product_position_idx"
        ).on(table.position),
    })
);

export const homeShopByCategories = pgTable("home_shop_by_categories", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    imageUrl: text("image_url").notNull(),
    url: text("url"),
    title: text("title"),
    ...timestamps,
});

export const homeShopByCategoryTitle = pgTable("home_shop_by_category_title", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull().default("Shop by Category"),
    ...timestamps,
});

export const homeshopbyNewCategory = pgTable("home_shop_by_new_categories", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});


export const womenHomeBannersSection = pgTable("women_home_banners_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenExploreCategorySection = pgTable("women_home_explore_categories_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenElavateLookSection = pgTable("women_home_elavate_look_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenMiddleBuyNowSection = pgTable("women_home_buy_now_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenStyleDirectorySection = pgTable("women_style_directory_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenNewCollectionSection = pgTable("women_new_collection_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenOfferSection = pgTable("women_Offer_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenMoodBoardSection = pgTable("women_mood_board_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenStyleSubstanceSection = pgTable("women_style_substance_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenSummerSaleSection = pgTable("women_style_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenFindYourStyleSection = pgTable("women_find_style_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenSuggestedLookSection = pgTable("women_suggested_look_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenBrandSection = pgTable("women_brand_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenBranStoryTellingSection = pgTable("women_brand_story_telling_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenBrandSkinCareSection = pgTable("women_brand_skin_care_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const menHomeBannersSection = pgTable("men_home_banners_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const menExploreCategory = pgTable("men_explore_category", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const menElavateLookSection = pgTable("men_home_elavate_look_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});


export const menMiddleBaannerSection = pgTable("men_middle_banner_Section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});



export const menstyleDirectory = pgTable("men_home_Style_directory", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});


export const menTopCollection = pgTable("men_top_collection", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const menDiscountOfferSection = pgTable("men_discount_offer_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const menSuggestedLookForYou = pgTable("men_suggested_look_for_you", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const menNewCollectionSectionn = pgTable("men_home_new_collection_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const menTopCollectionBanner = pgTable("men_top_collection_banner", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenStyleWithSubstance = pgTable("women_style_with_substance", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});



export const kidHomeBannersSection = pgTable("kids_home_banners_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenGetReadySection = pgTable("women_get_ready_section", {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const kidExploreCategory = pgTable("kid_explore_category", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const womenNewCollectionDiscountSection = pgTable("women_new_collection_discount_section", {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const kidElavateLookSection = pgTable("kid_home_elavate_look_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});


export const kidSpecialCareSection = pgTable("kid_special_care_Section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});



export const menMoodBoardSection = pgTable("men_mood_board_section", {
        id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const kidsDiscountOfferSection = pgTable("kids_discount_offer_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const kidGentleCareOthers = pgTable("kids_gentle_care_others", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const kidForstGiraffeOthers = pgTable("kids_formal_giraffe_others", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const menFreshInkCollectionSection = pgTable("men_fresh_ink_collection", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const kidsDollBuyingSectionn = pgTable("kids_doll_buying_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const kidsTwiningMomSection = pgTable("kids_twining_mom_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeandLivingBanner = pgTable("home_living_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeAndLivingexploreCategorySection = pgTable("home_living_explore_category_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeAndLivingNewCollectionSection = pgTable("home_living_new_Collection_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});


export const homeAndLivingTopPicks = pgTable("home_and_living_top_picks", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeAndLivingBannerMiddle = pgTable("home_and_living_top_picks", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeAndLivingEcoBanner = pgTable("home_and_living_eco_banner_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeAndLivingBrandSection = pgTable("home_and_living_brand_Section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeAndLivingCurateConciousSection = pgTable("home_living_curate_concious_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const beautyBannerSection = pgTable("beauty_living_banner", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});
export const beautyExploreCategorySection = pgTable("beauty_explore_category_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const beautySkinBannerSection = pgTable("beauty_skin_banner_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const beautyCareRoutineSection = pgTable("beauty_care_routine_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const beautyNurtureSection = pgTable("beauty_nurture_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const beautyDiscountSection = pgTable("beauty_discount_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const beautBestSellerSection = pgTable("beauty_best_seller_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});


export const beautMindFulSection = pgTable("beauty_mindful_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const beautySkinQuizSection = pgTable("beauty_skin_quiz_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});


export const homePageAboutUsTrsutedBanner = pgTable("home_page_trust_banner", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});


export const homeBrandIntroductionBanner = pgTable("home_brand_introduction_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeMatchingBanner = pgTable("home_matching_banner", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeMakeFirstClick = pgTable("home_make_first_concious_click_banner", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeSwapBannerSection = pgTable("home_swap_banner_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeNewArtisanSection = pgTable("home_artisan_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeNewInstaBannerSection = pgTable("home_insta_banner_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeEffortlessEleganceSection = pgTable("home_efforless_elegance", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});

export const homeEventBannerSectionOne = pgTable("home_event_banner_section", {
    id: uuid("id").primaryKey().notNull().unique().defaultRandom(),
    title: text("title").notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    url: text("url"),
    ...timestamps,
});