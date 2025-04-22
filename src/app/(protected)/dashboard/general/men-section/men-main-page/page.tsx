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
    title: "Women Home Banner",
    description: "Manage the platform's women home banner",
};

// Define the menu items with their titles, URLs, permissions, and query keys
const menuItems = {
    title: "Men Main page Section",
    url: "#",
    icon: "Megaphone",
    items: [
        {
            title: "Mens Banners Section",
            url: "/dashboard/general/men-section/men-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
            queryKey: "getAllHomeBanners",
        },
        {
            title: "Explore Categories Section",
            url: "/dashboard/general/men-section/explore-category",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getAllexploreCategories",
        },
        {
            title: "Elavate Your Looks Section",
            url: "/dashboard/general/men-section/elavate-looks",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getAllElevateLooks", // Replace with actual query key
        },
        {
            title: "Outfit Varients",
            url: "/dashboard/general/men-section/outfit-varients",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getAllOutfitVariants", // Replace with actual query key
        },
        {
            title: "Style Directory Section",
            url: "/dashboard/general/men-section/style-directory",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getAllStyleDirectory", // Replace with actual query key
        },
         {
            title: "Top Collection Section ",
            url: "/dashboard/general/men-section/top-collection",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getAllTopCollection", // Replace with actual query key
        },
        {
            title: "Discount Offer Section ",
            url: "/dashboard/general/men-section/discount-offer",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getAllDiscountOffer", // Replace with actual query key

        },
        // {
        //     title: "Seasonal Sale Section ",
        //     url: "/dashboard/general/men-section/seasonal-sale",
        //     permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
        //     queryKey: "getAllSeasonalSale", // Replace with actual query key

        // },

        {
            title: "Suggested Look Section ",
            url: "/dashboard/general/men-section/suggested-looks",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getAllSuggestedLooks", // Replace with actual query key
        },
       {
            title: "New Collection Section",
            url: "/dashboard/general/men-section/new-collection",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getAllNewCollection", // Replace with actual query key
        },


    ]
};

// Mapping of query keys to actual query functions
const queryMap: Record<string, (params: { limit: number; page: number }) => Promise<any[]>> = {
    getAllHomeBanners: WomenHomeSectionQueries.getMenHomeBannerSections,
    getAllexploreCategories: WomenHomeSectionQueries.getMenExploreCategorySections,
    getAllElevateLooks: WomenHomeSectionQueries.getMenelevateLooksections,
    getAllOutfitVariants: WomenHomeSectionQueries.getMenOutFitVarientSections,
    getAllStyleDirectory: WomenHomeSectionQueries.getStyleDirectorySections,
    getAllNewCollection: WomenHomeSectionQueries.getMenNewCollections,
    getAllDiscountOffer: WomenHomeSectionQueries.getDiscountOfferSections,
    getAllTopCollection: WomenHomeSectionQueries.getTopCollectionSections,
    getAllSeasonalSale: WomenHomeSectionQueries.getWomenSummerSaleSections,
    getAllFindYourStyle: WomenHomeSectionQueries.getWomenSummerSaleSections,
    getAllSuggestedLooks: WomenHomeSectionQueries.getSuggestedLooksForYous,
};

// Function to fetch the first product's image URL for a section
async function fetchFirstProductImage(queryKey: string, sectionTitle: string): Promise<string> {
    try {
        const queryFn = queryMap[queryKey];
        if (!queryFn) {
            throw new Error(`No query function found for ${queryKey}`);
        }
        const products = await queryFn({
            limit: 1,
            page: 1,
        });
        if (!products || products.length === 0) {
            throw new Error(`No products found for ${sectionTitle}`);
        }
        // Assuming products is an array with imageUrl field in each product
        const imageUrl = products[0]?.imageUrl;
        if (!imageUrl) {
            throw new Error(`No imageUrl found for first product in ${sectionTitle}`);
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