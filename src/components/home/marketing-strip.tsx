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
    return (
        <section
            className={cn(
                "flex w-full justify-center py-5 pt-10 md:px-8 md:py-10 md:pt-20",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-5xl xl:max-w-[100rem]">
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
                                <Link href="/soon" className="space-y-4">
                                    <div className="aspect-[3/3.5]">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            width={1000}
                                            height={1000}
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
