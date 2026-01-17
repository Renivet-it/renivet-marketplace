import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface PageProps extends GenericProps {
    shopByCategories: HomeShopByCategory[];
    title?: string;
}

export function ElevateYourLooks({
    className,
    shopByCategories,
    title = "Refine Your Style",
    ...props
}: PageProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center bg-[#FCFBF4] py-12",
                className
            )}
            {...props}
        >
            <div className="relative mx-auto w-full max-w-screen-2xl px-4">
                {/* Title */}
                <h4 className="mb-12 text-center text-3xl font-bold text-gray-900">
                    {title}
                </h4>

                {/* Carousel */}
                <div className="relative px-2">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                            slidesToScroll: "auto",
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2">
                            {shopByCategories.map((category, index) => (
                                <CarouselItem
                                    key={index}
                                    className="min-w-0 basis-1/3 pl-2 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                                >
                                    <Link
                                        href={category.url || "/shop"}
                                        className="group flex w-full flex-col items-center px-1"
                                    >
                                        <div className="mb-4 aspect-square w-full overflow-hidden rounded-full">
                                            <div className="h-full w-full overflow-hidden rounded-full">
                                                <Image
                                                    src={category.imageUrl}
                                                    alt={
                                                        category.title ||
                                                        "Category"
                                                    }
                                                    width={176}
                                                    height={176}
                                                    sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, 160px"
                                                    quality={100}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-center text-lg font-medium uppercase text-gray-800 sm:text-sm">
                                            {category.title || "Category"}
                                        </p>
                                    </Link>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-0 top-1/2 hidden -translate-x-6 -translate-y-1/2 md:flex" />
                        <CarouselNext className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-6 md:flex" />
                    </Carousel>
                </div>
            </div>
        </section>
    );
}
