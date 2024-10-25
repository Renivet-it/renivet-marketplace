"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";

export function Collection({ className, ...props }: GenericProps) {
    const demoData = [
        {
            title: "T-Shirts",
            img: "/images/collection1.jpeg",
        },
        {
            title: "Hoodies",
            img: "/images/collection2.jpeg",
        },
        {
            title: "T-shirts",
            img: "/images/collection3.jpeg",
        },
        {
            title: "COLLECTION",
            img: "/images/collection4.jpeg",
        },
        {
            title: "New Arrivals",
            img: "/images/collection5.jpeg",
        },
        {
            title: "Exclusive",
            img: "/images/collection6.jpg",
        },
    ];

    return (
        <section
            className={cn(
                "relative flex w-full justify-center py-5 md:py-10",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-[100rem]">
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
                        {demoData.map((item, index) => (
                            <CarouselItem
                                key={index}
                                className="space-y-4 text-center md:basis-1/2 lg:basis-1/4"
                            >
                                <div className="h-96">
                                    <Image
                                        width={1000}
                                        height={1000}
                                        src={item.img}
                                        alt={item.title}
                                        className="size-full object-cover"
                                    />
                                </div>

                                <h3 className="text-lg font-semibold uppercase">
                                    {item.title}
                                </h3>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}