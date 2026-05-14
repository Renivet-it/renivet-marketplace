import { DiscoverPrompt } from "@/components/home/new-home-page/discover-prompt";
import { SwipeCard } from "@/components/home/new-home-page/swipe-card";
import { GeneralShell } from "@/components/globals/layouts";
import { siteConfig } from "@/config/site";
import { productQueries } from "@/lib/db/queries";
import { getAbsoluteURL } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Discover | Renivet",
    description:
        "Swipe through a curated Renivet discovery feed and save products you want to revisit.",
    alternates: {
        canonical: getAbsoluteURL("/discover"),
    },
    openGraph: {
        title: "Discover | Renivet",
        description:
            "Swipe through a curated Renivet discovery feed and save products you want to revisit.",
        url: getAbsoluteURL("/discover"),
        type: "website",
        images: [
            {
                ...siteConfig.og,
                alt: "Renivet Discover",
            },
        ],
    },
};

export default async function DiscoverPage() {
    const { userId } = await auth();
    const products = await productQueries.getHomePageFeaturedProducts();

    return (
        <GeneralShell
            classNames={{
                mainWrapper: "bg-white",
                innerWrapper: "!max-w-none !p-0",
            }}
        >
            <DiscoverPrompt />
            <SwipeCard products={products} userId={userId ?? undefined} />
        </GeneralShell>
    );
}
