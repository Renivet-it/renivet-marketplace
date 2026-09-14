"use client";

import { ProductCard } from "@/components/globals/cards";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import type { CachedWishlist, ProductWithBrand } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface FestiveProductCarouselProps {
    products: ProductWithBrand[];
    wishlist?: CachedWishlist[];
    userId?: string;
}

export function FestiveProductCarousel({
    products,
    wishlist = [],
    userId,
}: FestiveProductCarouselProps) {
    return (
        <section
            data-festive-section="festive-edit"
            className="bg-[#eef0d6] bg-gradient-to-b from-[#e2e7d3] via-[#f0ebe0] to-[#fae2da] px-3 py-5 md:px-8 md:py-8"
        >
            <div className="grid grid-cols-[145px_minmax(0,1fr)] items-start gap-2.5 md:grid-cols-[224px_minmax(0,1fr)] md:gap-5">
                <div className="flex shrink-0 flex-col overflow-hidden">
                    <Link
                        href="/shop"
                        className="relative block overflow-hidden transition-transform duration-300 hover:scale-[1.01]"
                    >
                        <Image
                            src="/assets/festive-home/festive-edit-panel.png"
                            alt="The Festive Edit - view all products"
                            width={560}
                            height={585}
                            className="h-auto w-full object-contain"
                            priority
                        />
                    </Link>
                    <Image
                        src="/assets/festive-home/pond-peacock-wide.png"
                        alt=""
                        width={560}
                        height={179}
                        className="-mt-1 h-[46px] w-full object-cover object-left md:h-[72px]"
                    />
                </div>

                {products.length ? (
                    <Carousel
                        opts={{ align: "start", containScroll: "trimSnaps" }}
                        className="group/carousel relative min-w-0"
                    >
                        <CarouselContent className="-ml-3 md:-ml-4">
                            {products.map((product) => (
                                <CarouselItem
                                    key={product.id}
                                    className="basis-[145px] pl-3 md:basis-1/3 md:pl-4 lg:basis-1/4 xl:basis-1/5"
                                >
                                    <ProductCard
                                        className="h-full min-w-0"
                                        product={product}
                                        isWishlisted={wishlist.some(
                                            (item) =>
                                                item.productId === product.id
                                        )}
                                        userId={userId}
                                        theme="festive-editorial"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                ) : (
                    <div className="flex min-h-48 items-center justify-center border border-[#d9c7b8] bg-[#fff7ee]/55 px-6 text-center text-sm text-[#705b50]">
                        The festive collection is being curated. Explore all
                        products while new selections arrive.
                    </div>
                )}
            </div>
        </section>
    );
}
