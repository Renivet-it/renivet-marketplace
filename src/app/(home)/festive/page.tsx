import { FestiveSeason } from "@/components/home/new-home-page/festive-season";
import { siteConfig } from "@/config/site";
import { productQueries } from "@/lib/db/queries";
import { getAbsoluteURL } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Rakhi Collection",
    description:
        "Discover Renivet's curated Rakhi collection, selected for celebrating meaningful bonds with conscious gifting.",
    alternates: {
        canonical: getAbsoluteURL("/festive"),
    },
    openGraph: {
        title: "Rakhi Collection | Renivet",
        description:
            "Shop Renivet's curated Rakhi collection for thoughtful festive gifting.",
        url: getAbsoluteURL("/festive"),
        type: "website",
        images: [
            {
                ...siteConfig.og,
                alt: "Renivet Rakhi Collection",
            },
        ],
    },
};

export default async function FestivePage() {
    const [{ userId }, selected] = await Promise.all([
        auth(),
        productQueries.getFestiveSeasonProducts(),
    ]);
    const products = selected
        .map((entry: any) => entry.product)
        .filter(Boolean);

    return (
        <FestiveSeason
            products={products as any}
            userId={userId ?? undefined}
            className="min-h-full"
            showAllProducts
        />
    );
}
