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
            <div className="container">
                <div className="space-y-4 md:hidden">
                    {[firstRow, secondRow].map((row, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="flex w-full gap-4 overflow-x-auto px-1 scrollbar-hide"
                        >
                            {row.map((item, index) => (
                                <Link
                                    key={index}
                                    href="/shop"
                                    className="min-w-[140px] flex-shrink-0 flex flex-col items-center text-center space-y-2"
                                >
                                    <div className="relative w-full aspect-[3/4]">
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

                <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-4">
                    {marketingStrip.map((item, index) => (
                        <Link
                            key={index}
                            href="/shop"
                            className="flex flex-col items-center text-center space-y-2"
                        >
                            <div className="relative w-full aspect-[3/4]">
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
            </div>
        </section>
    );
}
