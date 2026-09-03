import { StorefrontCatalogPage, type StorefrontSearchParams } from "@/components/shop/storefront-catalog-page";
import { siteConfig } from "@/config/site";
import { getAbsoluteURL } from "@/lib/utils";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Festive Collection",
    description:
        "Discover Renivet's curated festive collection, selected for conscious celebrations and thoughtful gifting.",
    alternates: {
        canonical: getAbsoluteURL("/festive"),
    },
    openGraph: {
        title: "Festive Collection | Renivet",
        description:
            "Shop Renivet's curated festive collection for thoughtful gifting.",
        url: getAbsoluteURL("/festive"),
        type: "website",
        images: [
            {
                ...siteConfig.og,
                alt: "Renivet Festive Collection",
            },
        ],
    },
};

export default async function FestivePage({
    searchParams,
}: {
    searchParams: Promise<StorefrontSearchParams>;
}) {
    return (
        <StorefrontCatalogPage
            searchParams={searchParams}
            basePath="/festive"
            breadcrumbBaseItems={[
                { label: "Home", href: "/" },
                { label: "Shop", href: "/festive" },
            ]}
            catalogContext="festive"
            defaultSortBy="createdAt"
            defaultSortOrder="desc"
            hideRecommendationSorts
            hero={
                <section className="overflow-hidden rounded-[20px] bg-[#F0EBE2] p-2 md:mx-auto md:max-w-[1280px] md:rounded-[28px] md:p-3">
                    <Image
                        src="/assets/festive-season/festive-banner-desktop.png"
                        alt="Celebrate consciously — sustainable festive picks"
                        width={2048}
                        height={865}
                        priority
                        unoptimized
                        className="hidden h-auto w-full md:block"
                    />
                    <Image
                        src="/assets/festive-season/festive-banner.png"
                        alt="Celebrate consciously — sustainable festive picks"
                        width={960}
                        height={516}
                        priority
                        unoptimized
                        className="h-auto w-full md:hidden"
                    />
                </section>
            }
        />
    );
}
