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

interface PageProps extends GenericProps {
    brandProducts: HomeBrandProduct[];
}

export function BrandProducts({
    className,
    brandProducts,
    ...props
}: PageProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center py-5 md:px-8 md:py-10",
                className
            )}
            {...props}
        >
            <div className="container md:hidden">
                <div className="flex justify-center gap-2">
                    <h2
                        className={cn(
                            "text-xl sm:text-3xl",
                            "text-center",
                            "capitalize",
                            "pb-4"
                        )}
                    >
                        Our Women&apos;s Store
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
                <div className="flex justify-center gap-2 mb-6">
                    <h2
                        className={cn(
                            "text-xl sm:text-3xl",
                            "text-center",
                            "capitalize"
                        )}
                    >
                        Our Women&apos;s Store
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
                                    href={item.url || "/shop"}
                                    className="block"
                                >
                                    {/* Brand Name Above Image */}
                                    <div className="text-center mb-2">
                                        <span className="text-lg font-semibold text-gray-900">
                                            { `Brand ${index + 1}`}
                                        </span>
                                    </div>
                                    <div className="aspect-[3/4] overflow-hidden">
                                        <Image
                                            src={item.imageUrl}
                                            alt={ `Brand Product ${index + 1}`}
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
            href={product.url || "/shop"}
            className="relative w-[200px] flex-shrink-0 md:w-auto"
        >
            {/* Brand Name Above Image */}
            <div className="text-center mb-2">
                <span className="text-lg font-semibold text-gray-900">
                    {"Brand"}
                </span>
            </div>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[8px] shadow-sm">
                <Image
                    src={product.imageUrl}
                    alt={"product"}
                    width={300}
                    height={400}
                    quality={90}
                    className="object-cover transition-transform duration-300 hover:scale-105"
                />
            </div>
        </Link>
    );
}