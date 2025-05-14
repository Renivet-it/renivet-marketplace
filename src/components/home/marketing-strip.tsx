"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { MarketingStrip as TypeMarketingStrip } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    marketingStrip: TypeMarketingStrip[];
}

export function MarketingStrip({
    className,
    marketingStrip,
    ...props
}: PageProps) {
    const half = Math.ceil(marketingStrip.length / 2);
    const firstRow = marketingStrip.slice(0, half);
    const secondRow = marketingStrip.slice(half);
    return (
        <section
            className={cn(
                "flex w-full justify-center py-5 pt-10 md:px-8 md:py-10 md:pt-20",
                className
            )}
            {...props}
        >
            <div className="container md:hidden">
                <div className="space-y-4">
                    {[firstRow, secondRow].map((row, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="scrollbar-hide flex w-full gap-4 overflow-x-auto px-1"
                        >
                            {row.map((item, index) => (
                                <Link
                                    key={index}
                                    href="/shop"
                                    className="flex min-w-[140px] flex-shrink-0 flex-col items-center space-y-2 text-center"
                                >
                                    <div className="relative aspect-[3/4] w-full">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <h3 className="text-sm font-light capitalize">
                                        {item.title}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="hidden md:block w-full max-w-5xl xl:max-w-[100rem]">
                <Carousel
                    plugins={[
                        Autoplay({
                            delay: 2000,
                        }),
                    ]}
                    opts={{
                        loop: true,
                        align: "start",
                    }}
                >
                    <CarouselContent className="flex flex-row gap-4">
                        {marketingStrip.map((item, index) => (
                            <CarouselItem
                                key={index}
                                className="text-center md:basis-1/2 lg:basis-1/4"
                            >
                                <Link href="/shop" className="space-y-4">
                                    <div className="aspect-[3/4]">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            width={1000}
                                            height={1000}
                                            quality={90}
                                            className="size-full object-cover"
                                        />
                                    </div>

                                    <h3 className="text-lg font-semibold uppercase">
                                        {item.title}
                                    </h3>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}
