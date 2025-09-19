"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { HomeBrandProduct } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
    brandProducts: HomeBrandProduct[];
    className?: string;
}

export function WomenBrandProducts({
    className,
    brandProducts,
}: PageProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center bg-white sm:bg-[#F4F0EC] py-2 md:px-8 md:py-10",
                className
            )}
          
        >
            <div className="container md:hidden">
                {/* Mobile Header */}
                <div className="flex flex-col items-center gap-2 mb-2">
                    <h2 className="text-lg sm:text-2xl font-normal sm:font-bold uppercase tracking-wider
                    font-serif sm:font-sans
                    ">
                        OUR&apos;S STORE
                    </h2>
                </div>
                <div className="scrollbar-hide flex flex-col gap-4 overflow-x-auto px-1">
                    <div className="flex gap-4">
                        {brandProducts.map((item, index) => (
                            <BrandCard key={index} product={item} />
                        ))}
                    </div>
                </div>
            </div>
            <div className="hidden w-full max-w-5xl md:block xl:max-w-[100rem]">
                {/* Desktop Header */}
                <div className="flex flex-col items-center gap-2 mb-8">
                    <h2 className="text-3xl font-bold uppercase tracking-wider">
                        OUR&apos;S STORE
                    </h2>
                </div>

                <Carousel
                    plugins={[
                        Autoplay({
                            delay: 5000,
                        }),
                    ]}
                    opts={{
                        loop: true,
                        align: "start",
                    }}
                >
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {brandProducts.map((item, index) => (
                            <CarouselItem
                                key={index}
                                className="pl-2 md:basis-1/3 md:pl-4 lg:basis-1/6"
                            >
                                <Link
                                    href={item.url || "/shop/women/dresses"}
                                    className="block"
                                >
                                    <div className="aspect-[3/4] overflow-hidden">
                                        <Image
                                            src={item.imageUrl}
                                            alt={`Women's Dress ${index + 1}`}
                                            width={300}
                                            height={400}
                                            quality={90}
                                            className="size-full object-cover"
                                        />
                                    </div>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    <CarouselPrevious className="left-0 h-full rounded-none border-none bg-gradient-to-r from-background to-transparent hover:from-background hover:to-transparent" />
                    <CarouselNext className="right-0 h-full rounded-none border-none bg-gradient-to-l from-background to-transparent" />
                </Carousel>
            </div>
        </section>
    );
}

function BrandCard({ product }: { product: HomeBrandProduct }) {
    return (
        <Link
            href={product.url || "/shop/women/dresses"}
            className="relative w-[200px] flex-shrink-0 md:w-auto"
        >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[8px] shadow-sm">
                <Image
                    src={product.imageUrl}
                    alt={product.title || "Women's Dress"}
                    width={300}
                    height={400}
                    quality={90}
                    className="object-cover transition-transform duration-300 hover:scale-105"
                />
            </div>
        </Link>
    );
}