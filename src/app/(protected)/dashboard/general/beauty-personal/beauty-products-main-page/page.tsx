import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BitFieldSitePermission } from "@/config/permissions";
import {
    homeShopByCategoryQueries,
    WomenHomeSectionQueries,
} from "@/lib/db/queries";

// Metadata for the page
export const metadata: Metadata = {
    title: "Beauty Products Banner",
    description: "Manage the platform's Beauty Products banner",
};

// Define the menu items with their titles, URLs, permissions, and query keys
const menuItems = {
    title: "Beauty and products page Section",
    url: "#",
    icon: "Megaphone",
   items: [
       {
            title: "Banners Section",
            url: "/dashboard/general/beauty-personal/banners",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
            queryKey: "getAllHomeBanners",

        },
        {
            title: "Explore Categories Section",
            url: "/dashboard/general/beauty-personal/explore-category",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getAllexploreCategories",

        },
        {
            title: "Skincare Banner Section",
            url: "/dashboard/general/beauty-personal/skincare-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getSkincareBanner",
        },
        {
            title: "Beauty care Routine Section",
            url: "/dashboard/general/beauty-personal/beauty-routine",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getBeautyCareRoutine",
        },
        {
            title: "Nurture Section",
            url: "/dashboard/general/beauty-personal/nurture-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getNurtureBannerSection",
        },
                {
            title: "Discount Banner Section",
            url: "/dashboard/general/beauty-personal/discount-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getDiscountBannerSection",
        },
        {
            title: "Best Seller Banner",
            url: "/dashboard/general/beauty-personal/best-seller",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getBestSellerBannerSection",
        },
        {
            title: "Mindful starter Banner",
            url: "/dashboard/general/beauty-personal/mindful-starter",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getMindfulStarterBannerSection",
        },
        {
            title: "Skin quiz banner",
            url: "/dashboard/general/beauty-personal/skin-quiz",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getSkinQuizBannerSection",
        },
    ]

};

// Mapping of query keys to actual query functions
const queryMap: Record<string, (params: { limit: number; page: number }) => Promise<any[]>> = {
    getAllHomeBanners: WomenHomeSectionQueries.getBeautyPersonalSections,
    getAllexploreCategories: WomenHomeSectionQueries.getBeautyExploreCategorySections,
    getSkincareBanner: WomenHomeSectionQueries.getBeautySkinBannerSections,
    getBeautyCareRoutine: WomenHomeSectionQueries.getBeautyCareRoutinetions,
    getNurtureBannerSection: WomenHomeSectionQueries.getBeautyNurtureSections,
    getDiscountBannerSection: WomenHomeSectionQueries.getBeautyDiscountSections,
    getBestSellerBannerSection: WomenHomeSectionQueries.getBeautyBestSellerSections,
    getMindfulStarterBannerSection: WomenHomeSectionQueries.getBeautyMindFulSections,
    getSkinQuizBannerSection: WomenHomeSectionQueries.getBeautySkinQuizections,

};

async function fetchFirstProductImage(queryKey: string, sectionTitle: string): Promise<string> {
    try {
        const queryFn = queryMap[queryKey];
        if (!queryFn) {
            console.error(`No query function found for ${queryKey}`);
            return `https://via.placeholder.com/300x200?text=${encodeURIComponent(sectionTitle)}`;
        }
        const products = await queryFn({
            limit: 1,
            page: 1,
        });
        if (!products || products.length === 0) {
            console.warn(`No products found for ${sectionTitle}`);
            return `https://via.placeholder.com/300x200?text=${encodeURIComponent(sectionTitle)}`;
        }
        const imageUrl = products[0]?.imageUrl;
        if (!imageUrl) {
            console.warn(`No imageUrl found for first product in ${sectionTitle}`);
            return `https://via.placeholder.com/300x200?text=${encodeURIComponent(sectionTitle)}`;
        }
        return imageUrl;
    } catch (error) {
        console.error(`Error fetching image for ${sectionTitle}:`, error);
        return `https://via.placeholder.com/300x200?text=${encodeURIComponent(sectionTitle)}`;
    }
}
// Component to render a single card with the first product's image
async function SectionCard({ item }: { item: { title: string; url: string; permissions: number; queryKey: string } }) {
    const imageUrl = await fetchFirstProductImage(item.queryKey, item.title);

    return (
        <Link
            href={item.url}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200"
        >
            <div className="h-48 bg-gray-200">
                <img
                    src={imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-4 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
            </div>
        </Link>
    );
}

// Main page component
export default async function Page() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
            {menuItems.items.map((item) => (
                <Suspense
                    key={item.title}
                    fallback={
                        <div className="bg-white rounded-xl shadow-lg h-64 flex items-center justify-center">
                            <p>Loading {item.title}...</p>
                        </div>
                    }
                >
                    <SectionCard item={item} />
                </Suspense>
            ))}
        </div>
    );
}