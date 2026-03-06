"use client";

import type { ChatProduct } from "@/lib/store/chat-store";
import Image from "next/image";
import Link from "next/link";

interface ChatProductCardProps {
    product: ChatProduct;
}

export function ChatProductCard({ product }: ChatProductCardProps) {
    const price = product.price
        ? `₹${(product.price / 100).toFixed(0)}`
        : "Price on request";
    const comparePrice = product.compareAtPrice
        ? `₹${(product.compareAtPrice / 100).toFixed(0)}`
        : null;
    const isOnSale =
        comparePrice &&
        product.compareAtPrice &&
        product.price &&
        product.compareAtPrice > product.price;

    return (
        <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="group flex w-[160px] shrink-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
        >
            {/* Product Image */}
            <div className="relative aspect-square w-full overflow-hidden bg-gray-50">
                {product.image ? (
                    <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="160px"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-gray-300">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                        </svg>
                    </div>
                )}

                {/* Sale Badge */}
                {isOnSale && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        SALE
                    </span>
                )}
            </div>

            {/* Product Info */}
            <div className="flex flex-1 flex-col gap-0.5 p-2.5">
                {product.brandName && (
                    <span className="truncate text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        {product.brandName}
                    </span>
                )}

                <h4 className="line-clamp-2 text-xs font-medium leading-tight text-gray-800">
                    {product.title}
                </h4>

                <div className="mt-auto flex items-center gap-1.5 pt-1">
                    <span className="text-sm font-bold text-gray-900">
                        {price}
                    </span>
                    {isOnSale && comparePrice && (
                        <span className="text-[10px] text-gray-400 line-through">
                            {comparePrice}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

interface ChatProductCarouselProps {
    products: ChatProduct[];
}

export function ChatProductCarousel({ products }: ChatProductCarouselProps) {
    if (!products || products.length === 0) return null;

    return (
        <div className="mt-2 w-full">
            <div className="scrollbar-hide -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-2">
                {products.map((product) => (
                    <ChatProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
