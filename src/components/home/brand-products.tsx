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
                "flex w-full flex-col items-center bg-[#c8bcc0] py-5 md:px-8 md:py-10",
                className
            )}
            {...props}
        >
            <div className="mb-8 w-full text-center">
                <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl">
                    Explore Our Top Brands
                </h2>
                <p className="mt-2 text-sm text-gray-700 md:text-base">
                    Discover quality products from trusted brands
                </p>
            </div>

            <div className="w-full px-4 md:hidden">
                <div className="flex gap-6 overflow-x-auto pb-4">
                    {brandProducts.map((item, index) => (
                        <BrandCard key={index} product={item} />
                    ))}
                </div>
            </div>

            <div className="hidden w-full max-w-[1600px] md:block">
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
                    <CarouselContent className="-ml-2">
                        {brandProducts.map((item, index) => (
                            <CarouselItem
                                key={index}
                                className="basis-1/2 pl-2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6"
                            >
                                <div className="flex h-full flex-col items-center gap-3">
                                    <Link
                                        href={item.url || "/shop"}
                                        className="block w-full"
                                    >
                                        <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-white">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                width={300}
                                                height={400}
                                                quality={90}
                                                className="size-full object-cover"
                                            />
                                        </div>
                                    </Link>
                                    <p className="w-full text-center text-sm font-medium">
                                        {item.title}
                                    </p>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    <CarouselNext className="right-0 h-full rounded-none border-none bg-gradient-to-l from-background to-transparent" />
                </Carousel>
            </div>
        </section>
    );
}

function BrandCard({ product }: { product: HomeBrandProduct }) {
    return (
        <div className="flex w-[150px] shrink-0 flex-col items-center gap-3">
            <Link href={product.url || "/shop"} className="block w-full">
                <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-white">
                    <Image
                        src={product.imageUrl}
                        alt={product.title}
                        width={300}
                        height={400}
                        quality={90}
                        className="size-full object-cover"
                    />
                </div>
            </Link>
            <p className="w-full text-center text-sm font-medium">
                {product.title}
            </p>
        </div>
    );
}