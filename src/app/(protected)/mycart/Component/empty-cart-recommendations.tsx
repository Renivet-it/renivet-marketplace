"use client";

import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PLACEHOLDER_IMAGE_URL =
    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

const STATIC_FALLBACK_PRODUCTS = [
    {
        title: "Bestsellers Under ₹999",
        href: "/shop?maxPrice=999&sortBy=best-sellers",
        priceLabel: "Shop picks",
        imageUrl: PLACEHOLDER_IMAGE_URL,
    },
    {
        title: "Everyday Sustainable Finds",
        href: "/shop?sortBy=best-sellers",
        priceLabel: "Explore now",
        imageUrl: PLACEHOLDER_IMAGE_URL,
    },
    {
        title: "New Conscious Arrivals",
        href: "/shop?sortBy=createdAt&sortOrder=desc",
        priceLabel: "Fresh edits",
        imageUrl: PLACEHOLDER_IMAGE_URL,
    },
    {
        title: "Most Loved Styles",
        href: "/shop?sortBy=best-sellers",
        priceLabel: "View range",
        imageUrl: PLACEHOLDER_IMAGE_URL,
    },
];

type RecommendedProduct = {
    id: string;
    slug?: string | null;
    title?: string | null;
    price?: number | null;
    brand?: { name?: string | null } | null;
    media?: Array<{
        mediaItem?: { url?: string | null; alt?: string | null } | null;
    }> | null;
    variants?: Array<{ price?: number | null }>;
};

function getProductImage(product: RecommendedProduct) {
    return (
        product.media?.find((media) => media.mediaItem?.url)?.mediaItem?.url ??
        PLACEHOLDER_IMAGE_URL
    );
}

function getProductPrice(product: RecommendedProduct) {
    return product.variants?.[0]?.price ?? product.price ?? 0;
}

export function EmptyCartRecommendations() {
    const { data, isLoading } = trpc.brands.products.getProducts.useQuery({
        limit: 4,
        page: 1,
        maxPrice: 999 * 100,
        isPublished: true,
        isAvailable: true,
        isActive: true,
        isDeleted: false,
        verificationStatus: "approved",
        sortBy: "best-sellers",
        sortOrder: "desc",
        requireMedia: true,
    });

    const products = (data?.data ?? []) as RecommendedProduct[];

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#f0f4eb] text-[#6B7A5E]">
                        <ShoppingBag className="size-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Your bag&apos;s empty.
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Start with these bestsellers under ₹999.
                    </p>
                </div>
                <Button asChild size="sm" variant="outline">
                    <Link href="/shop?maxPrice=999&sortBy=best-sellers">
                        View all
                    </Link>
                </Button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {isLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                          <div
                              key={index}
                              className="overflow-hidden rounded-lg border border-gray-100 bg-white"
                          >
                              <div className="aspect-[4/5] animate-pulse bg-gray-100" />
                              <div className="space-y-2 p-3">
                                  <div className="h-3 animate-pulse rounded bg-gray-100" />
                                  <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                              </div>
                          </div>
                      ))
                    : products.length > 0
                      ? products.slice(0, 4).map((product) => {
                            const price = getProductPrice(product);

                            return (
                                <Link
                                    key={product.id}
                                    href={
                                        product.slug
                                            ? `/products/${product.slug}`
                                            : "/shop?maxPrice=999&sortBy=best-sellers"
                                    }
                                    className="group overflow-hidden rounded-lg border border-gray-100 bg-white transition hover:border-[#c5d1b8] hover:shadow-sm"
                                >
                                    <div className="relative aspect-[4/5] bg-gray-50">
                                        <Image
                                            src={getProductImage(product)}
                                            alt={
                                                product.title ??
                                                "Recommended product"
                                            }
                                            fill
                                            className="object-cover transition duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 50vw, 25vw"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <p className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B7A5E]">
                                            {product.brand?.name ??
                                                "Renivet pick"}
                                        </p>
                                        <h3 className="mt-1 line-clamp-2 min-h-9 text-sm font-medium leading-snug text-gray-900">
                                            {product.title}
                                        </h3>
                                        <p className="mt-2 text-sm font-semibold text-gray-900">
                                            {formatPriceTag(
                                                +convertPaiseToRupees(price),
                                                true
                                            )}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })
                      : STATIC_FALLBACK_PRODUCTS.map((product) => (
                            <Link
                                key={product.title}
                                href={product.href}
                                className="group overflow-hidden rounded-lg border border-gray-100 bg-white transition hover:border-[#c5d1b8] hover:shadow-sm"
                            >
                                <div className="relative aspect-[4/5] bg-gray-50">
                                    <Image
                                        src={product.imageUrl}
                                        alt={product.title}
                                        fill
                                        className="object-cover transition duration-300 group-hover:scale-105"
                                        sizes="(max-width: 640px) 50vw, 25vw"
                                    />
                                </div>
                                <div className="p-3">
                                    <p className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wide text-[#6B7A5E]">
                                        Renivet pick
                                    </p>
                                    <h3 className="mt-1 line-clamp-2 min-h-9 text-sm font-medium leading-snug text-gray-900">
                                        {product.title}
                                    </h3>
                                    <p className="mt-2 text-sm font-semibold text-gray-900">
                                        {product.priceLabel}
                                    </p>
                                </div>
                            </Link>
                        ))}
            </div>
        </section>
    );
}
