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
