import { StorefrontCatalogPage, type StorefrontSearchParams } from "@/components/shop/storefront-catalog-page";
import { productQueries } from "@/lib/db/queries";
import {
    buildProductItemListJsonLd,
    serializeJsonLd,
} from "@/lib/seo/structured-data";
import { getAbsoluteURL } from "@/lib/utils";
import { FESTIVE_CAMPAIGN } from "@/lib/seo/festive-campaign";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: FESTIVE_CAMPAIGN.name,
    description: FESTIVE_CAMPAIGN.description,
    alternates: {
        canonical: getAbsoluteURL("/festive"),
    },
    openGraph: {
        title: FESTIVE_CAMPAIGN.social.title,
        description: FESTIVE_CAMPAIGN.social.description,
        url: getAbsoluteURL("/festive"),
        type: "website",
        images: [
            {
                url: FESTIVE_CAMPAIGN.art.openGraph.src,
                width: FESTIVE_CAMPAIGN.art.openGraph.width,
                height: FESTIVE_CAMPAIGN.art.openGraph.height,
                alt: FESTIVE_CAMPAIGN.art.openGraph.alt,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: FESTIVE_CAMPAIGN.social.title,
        description: FESTIVE_CAMPAIGN.social.description,
        images: [FESTIVE_CAMPAIGN.art.openGraph.src],
    },
};

export default async function FestivePage({
    searchParams,
}: {
    searchParams: Promise<StorefrontSearchParams>;
}) {
    const selected = await productQueries.getFestiveSeasonProducts();
    const products = selected.map(({ product }) => product);
    const productItemListJsonLd = buildProductItemListJsonLd({
        name: FESTIVE_CAMPAIGN.name,
        url: getAbsoluteURL("/festive"),
        products,
        productUrl: (slug) => getAbsoluteURL(`/products/${slug}`),
    });

    return (
        <div className="min-h-screen bg-[#F0EBE2]">
            {productItemListJsonLd ? (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: serializeJsonLd(productItemListJsonLd),
                    }}
                />
            ) : null}
            <StorefrontCatalogPage
                searchParams={searchParams}
                basePath="/festive"
                breadcrumbBaseItems={[
                    { label: "Home", href: "/" },
                    { label: "Shop", href: "/festive" },
                ]}
                catalogContext="festive"
                theme="festive"
                pageHeading={FESTIVE_CAMPAIGN.heading}
                defaultSortBy="recommended"
                defaultSortOrder="desc"
                hero={
                    <section className="overflow-hidden rounded-[20px] bg-[#F0EBE2] p-2 md:mx-auto md:max-w-[1280px] md:rounded-[28px] md:p-3">
                        <Image
                            src={FESTIVE_CAMPAIGN.art.desktopHero.src}
                            alt="Celebrate consciously — sustainable festive picks"
                            width={2048}
                            height={865}
                            unoptimized
                            className="hidden h-auto w-full md:block"
                        />
                        <Image
                            src={FESTIVE_CAMPAIGN.art.mobileHero.src}
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
        </div>
    );
}
