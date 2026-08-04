import {
    StorefrontCatalogPage,
    type StorefrontSearchParams,
} from "@/components/shop";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "New Arrivals",
    description:
        "Discover the latest products from independent brands on Renivet Marketplace.",
};

interface PageProps {
    searchParams: Promise<StorefrontSearchParams>;
}

export default function NewArrivalsPage({ searchParams }: PageProps) {
    return (
        <StorefrontCatalogPage
            searchParams={searchParams}
            basePath="/new-arrivals"
            breadcrumbBaseItems={[
                { label: "Home", href: "/" },
                { label: "New Arrivals", href: "/new-arrivals" },
            ]}
            defaultSortBy="createdAt"
            defaultSortOrder="desc"
            prioritizeNewProducts
            hideRecommendationSorts
            hero={
                <section className="overflow-hidden rounded-[28px] border border-[#e7dfd1] bg-[linear-gradient(120deg,#f8f4eb_0%,#fffdf8_55%,#edf2e8_100%)] px-6 py-9 sm:px-10 sm:py-12 md:rounded-[36px] md:px-14">
                    <p className="text-11 font-semibold uppercase tracking-[0.28em] text-[#8a7552]">
                        Freshly added
                    </p>
                    <h1 className="mt-3 font-playfair text-4xl leading-tight text-[#273020] sm:text-5xl">
                        New Arrivals
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d675b] sm:text-base">
                        Discover the latest styles, thoughtful essentials, and
                        standout finds, newly added and ready to make yours.
                    </p>
                </section>
            }
        />
    );
}
