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
    title: "Kids Home Banner",
    description: "Manage the platform's Kids home banner",
};

// Define the menu items with their titles, URLs, permissions, and query keys
const menuItems = {
    title: "Kids Main page Section",
    url: "#",
    icon: "Megaphone",
    items: [
        {
            title: "Kids Banners Section",
            url: "/dashboard/general/kids/kids-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
            queryKey: "getKidsBanner", // Replace with actual query key

        },
        {
            title: "Explore Categories Section",
            url: "/dashboard/general/kids/explore-category",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getKidsExploreCategory", // Replace with actual query key
        },
        {
            title: "Kids Special Care Section",
            url: "/dashboard/general/kids/special-care",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getKidsSpecialCareSection", // Replace with actual query key

        },
        {
            title: "Doll Banner Section",
            url: "/dashboard/general/kids/doll-banner-section",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getKidDollBannerSection", // Replace with actual query key

        },
        {
            title: "Discount Section",
            url: "/dashboard/general/kids/discount-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getKidDiscountSection", // Replace with actual query key

        },
        {
            title: "Twining Mom Section ",
            url: "/dashboard/general/kids/twining-section",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getTwiningSection", // Replace with actual query key

        },
    ]
};

// Mapping of query keys to actual query functions
const queryMap: Record<string, (params: { limit: number; page: number }) => Promise<any[]>> = {
    getKidsBanner: WomenHomeSectionQueries.getKidsBannerSections,
    getKidsExploreCategory: WomenHomeSectionQueries.getKidsExploreCategorySections,
    getKidDiscountSection: WomenHomeSectionQueries.getkidDiscountOfferSections,
    getKidsSpecialCareSection: WomenHomeSectionQueries.getKidsCareSections,
    getKidDollBannerSection: WomenHomeSectionQueries.getkidDollBuyingSections,
    getTwiningSection: WomenHomeSectionQueries.getkidDolllTwiningSections,

};

// Function to fetch the first product's image URL for a section
// async function fetchFirstProductImage(queryKey: string, sectionTitle: string): Promise<string> {
//     try {
//         const queryFn = queryMap[queryKey];
//         if (!queryFn) {
//             throw new Error(`No query function found for ${queryKey}`);
//         }
//         const products = await queryFn({
//             limit: 1,
//             page: 1,
//         });
//         if (!products || products.length === 0) {
//             throw new Error(`No products found for ${sectionTitle}`);
//         }
//         // Assuming products is an array with imageUrl field in each product
//         const imageUrl = products[0]?.imageUrl;
//         if (!imageUrl) {
//             throw new Error(`No imageUrl found for first product in ${sectionTitle}`);
//         }
//         return imageUrl;
//     } catch (error) {
//         console.error(`Error fetching image for ${sectionTitle}:`, error);
//         return `https://via.placeholder.com/300x200?text=${encodeURIComponent(sectionTitle)}`;
//     }
// }
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