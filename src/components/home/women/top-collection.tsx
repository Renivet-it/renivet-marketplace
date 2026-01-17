"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface CollectionItem {
    id: string;
    imageUrl: string;
    context?: string;
    title: string;
    description?: string;
    ctaText?: string;
    url: string;
    shape?: "circle" | "rectangle";
    isSpecial?: boolean;
}

interface PageProps {
    collections: CollectionItem[];
    title?: string;
    className?: string;
}

export function TopCollection({
    collections,
    title = "Top Collection",
    className,
}: PageProps) {
    if (!collections.length) return null;

    return (
        <section
            className={cn("w-full py-8 md:py-12", className)}
            style={{ backgroundColor: "#FCFBF4" }}
        >
            <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
                <h1 className="mb-8 text-left text-2xl font-bold text-gray-900 md:mb-12 md:text-3xl lg:text-4xl">
                    {title}
                </h1>
                <Carousel
                    opts={{
                        align: "start",
                        dragFree: true,
                        loop: true,
                        // @ts-ignore
                        autoplay: 3000,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-2 px-2 md:space-x-4 md:px-4">
                        {collections.map((collection) => (
                            <CarouselItem
                                key={collection.id}
                                className="basis-full snap-start pl-2 sm:basis-1/2 lg:basis-1/2"
                            >
                                <div
                                    className="group relative flex h-full flex-col items-start space-y-3 overflow-hidden rounded-xl p-4 text-left shadow-sm transition-all duration-300 md:space-y-4 md:rounded-2xl md:p-6"
                                    style={{ backgroundColor: "#FCFBF4" }}
                                >
                                    {/* Context/Brand Label */}
                                    {collection.context && (
                                        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 md:text-sm">
                                            <span className="text-base font-bold text-black md:text-lg">
                                                🌍
                                            </span>
                                            <span>{collection.context}</span>
                                        </div>
                                    )}

                                    {/* Responsive Image Container */}
                                    <div
                                        className={cn(
                                            "relative w-full overflow-hidden rounded-lg md:rounded-xl",
                                            "aspect-[16/9] md:h-[322px] md:w-[571px]" // Mobile: 16:9, Desktop: fixed 571×322
                                        )}
                                        style={{ backgroundColor: "#FCFBF4" }}
                                    >
                                        <Image
                                            src={collection.imageUrl}
                                            alt={collection.title}
                                            width={571}
                                            height={322}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, 571px"
                                        />
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-lg font-bold uppercase text-gray-900 md:text-xl">
                                        {collection.title}
                                    </h2>

                                    {/* Description */}
                                    {collection.description && (
                                        <p className="text-xs text-gray-600 md:text-sm">
                                            {collection.description}
                                        </p>
                                    )}

                                    {/* CTA Button */}
                                    {collection.isSpecial && (
                                        <Link
                                            href={collection.url}
                                            className="mt-1 inline-block rounded-lg bg-green-500 px-4 py-1 text-xs font-medium text-white transition hover:bg-green-600 md:mt-2 md:px-6 md:py-2 md:text-sm"
                                        >
                                            {collection.ctaText || "Buy now"}
                                        </Link>
                                    )}
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}
