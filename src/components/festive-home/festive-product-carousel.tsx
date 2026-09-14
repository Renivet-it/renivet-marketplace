"use client";

import { ProductCard } from "@/components/globals/cards";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
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
            className="bg-[#f4dcd5] px-3 py-6 md:px-8 md:py-9"
        >
            <div className="grid gap-5 md:grid-cols-[224px_minmax(0,1fr)]">
                <div className="overflow-hidden">
                    <Link
                        href="/shop"
                        className="relative block overflow-hidden"
                    >
                        <Image
                            src="/assets/festive-home/festive-edit-panel.png"
                            alt="The Festive Edit - view all products"
                            width={560}
                            height={585}
                            className="h-auto w-full"
                        />
                    </Link>
                    <Image
                        src="/assets/festive-home/pond-peacock-wide.png"
                        alt=""
                        width={560}
                        height={179}
                        className="hidden h-[72px] w-full object-cover object-left md:block"
                    />
                </div>

                {products.length ? (
                    <Carousel
                        opts={{ align: "start", containScroll: "trimSnaps" }}
                        className="min-w-0"
                    >
                        <CarouselContent className="-ml-3">
                            {products.map((product) => (
                                <CarouselItem
                                    key={product.id}
                                    className="basis-[68%] pl-3 sm:basis-[44%] lg:basis-1/4 xl:basis-1/5"
                                >
                                    <ProductCard
                                        className="h-full min-w-0"
                                        product={product}
                                        isWishlisted={wishlist.some(
                                            (item) =>
                                                item.productId === product.id
                                        )}
                                        userId={userId}
                                        theme="festive"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2 hidden border-[#d8c6b6] bg-[#fff9ef]/95 text-[#67202a] shadow-md md:flex" />
                        <CarouselNext className="right-2 hidden border-[#d8c6b6] bg-[#fff9ef]/95 text-[#67202a] shadow-md md:flex" />
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
