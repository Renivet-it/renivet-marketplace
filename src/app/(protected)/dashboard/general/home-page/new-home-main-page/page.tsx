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
    title: "New Home Page",
    description: "Manage the platform's New Home Page",
};

// Define the menu items with their titles, URLs, permissions, and query keys
const menuItems = {
    title: "Home page Section",
    url: "#",
    icon: "Megaphone",
   items: [

        {
            title: "Trusted Curated Banner",
            url: "/dashboard/general/home-page/curated-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES,
            queryKey: "getcuratedBannerSection",

        },
        {
            title: "Brand Introduction Banner",
            url: "/dashboard/general/home-page/brand-introduction",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getBrandIntroductionSection",
        },
        {
            title: "Home Matching Banner",
            url: "/dashboard/general/home-page/home-matching",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getHomeMatchingSection",
        },
        {
            title: "Make First Click Banner",
            url: "/dashboard/general/home-page/make-first-click",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getMakeFirstClickSection",
        },
        {
            title: "Swap Space Banner",
            url: "/dashboard/general/home-page/swap-space",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getSwapSpaceSection",
        },
        {
            title: "New Artisan Section",
            url: "/dashboard/general/home-page/new-artisan-section",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getNewArtisanSection",
        },
        {
            title: "New Insta Bannner",
            url: "/dashboard/general/home-page/new-insta-banner",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getNewInstaBannerSection",
        },
                {
            title: "Elegance section Bannner",
            url: "/dashboard/general/home-page/effortless-elegance-section",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getEffortlessEleganceSection",
        },
    {
            title: "Event Banner One",
            url: "/dashboard/general/home-page/event-section-one",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getEventSectionOne",
        },
        {
            title: "Event Banner Two(Video)",
            url: "/dashboard/general/home-page/event-section-two",
            permissions: BitFieldSitePermission.MANAGE_CATEGORIES | BitFieldSitePermission.MANAGE_BRANDS,
            queryKey: "getEventSectionTwo",
        },
    ]

};

// Mapping of query keys to actual query functions
const queryMap: Record<string, (params: { limit: number; page: number }) => Promise<any[]>> = {
    getcuratedBannerSection: WomenHomeSectionQueries.getHomePageTrustedSections,
    getBrandIntroductionSection: WomenHomeSectionQueries.getHomePageBrandIntroductionSections,
    getHomeMatchingSection: WomenHomeSectionQueries.getHomePageMatchingSections,
    getMakeFirstClickSection: WomenHomeSectionQueries.getHomePageFirstConciousClickSections,
    getSwapSpaceSection: WomenHomeSectionQueries.getHomePageSwapBannerSections,
    getNewArtisanSection: WomenHomeSectionQueries.getHomePageNewArtisanSections,
    getNewInstaBannerSection: WomenHomeSectionQueries.getHomePageInsaBannerSections,
    getEffortlessEleganceSection: WomenHomeSectionQueries.getHomePageEffortlessEleganceSections,
    getEventSectionOne: WomenHomeSectionQueries.getHomePageEventOneSections,
    getEventSectionTwo: WomenHomeSectionQueries.getHomePageEventTwoSections,

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