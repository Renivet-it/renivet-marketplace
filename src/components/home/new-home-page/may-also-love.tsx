"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import { ArrowLeft, ArrowRight } from "lucide-react";
import React from "react";
import { ProductCard } from "./new-arrivals";

export function MayAlsoLoveThese({
    banners,
    userId,
    className,
}: {
    banners: Banner[];
    userId?: string;
    className?: string;
}) {
    if (!banners || !banners.length) return null;

    const [api, setApi] = React.useState<any>(null);
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);
    const items = banners.slice(0, 18);

    React.useEffect(() => {
        if (!api) return;

        const updateControls = () => {
            setCanScrollPrev(api.canScrollPrev());
            setCanScrollNext(api.canScrollNext());
        };

        updateControls();
        api.on("select", updateControls);
        api.on("reInit", updateControls);

        return () => {
            api.off("select", updateControls);
            api.off("reInit", updateControls);
        };
    }, [api]);

    return (
        <section className={cn("w-full bg-white py-10 md:py-14", className)}>
            <div className="mx-auto max-w-screen-3xl px-4 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col items-start gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-[11px]">
                            Our Recommendations
                        </span>
                        <h2 className="mt-2 font-playfair text-[28px] font-normal uppercase leading-[1.3] text-gray-900 md:text-[36px]">
                            You Might Also Like
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => api?.scrollPrev()}
                            disabled={!canScrollPrev}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-md transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Previous products"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => api?.scrollNext()}
                            disabled={!canScrollNext}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-md transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Next products"
                        >
                            <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <Carousel
                    setApi={setApi}
                    opts={{
                        align: "start",
                        dragFree: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-3">
                        {items.map((item) => {
                            if (!item.product) return null;
                            return (
                                <CarouselItem
                                    key={item.id}
                                    className="basis-[140px] pl-3 md:basis-[200px] lg:basis-[220px] xl:basis-[240px]"
                                >
                                    <ProductCard
                                        product={item.product as any}
                                        userId={userId}
                                    />
                                </CarouselItem>
                            );
                        })}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}
