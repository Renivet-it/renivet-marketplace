import React from "react";
import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";

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
                "flex w-full justify-center py-12 bg-white",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-screen-2xl mx-auto px-4">
                {/* Title */}
                <h4 className="text-center text-3xl font-bold text-gray-900 mb-12">
                    {title}
                </h4>

                {/* Carousel */}
                <div className="px-2">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                            slidesToScroll: "auto"
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2">
                            {shopByCategories.map((category, index) => (
                                <CarouselItem
                                    key={index}
                                    className="pl-2 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 min-w-0"
                                >
                                    <Link
                                        href={category.url || "/shop"}
                                        className="group flex flex-col items-center w-full px-1"
                                    >
                                        <div className="rounded-lg overflow-hidden w-full aspect-square mb-4 border border-gray-200 group-hover:border-gray-400 transition-colors">
                                            <Image
                                                src={category.imageUrl}
//@ts-ignore
                                                alt={category.title || "Category"}
                                                width={200}
                                                height={200}
                                                sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, 160px"
                                                quality={100}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <p className="text-lg font-medium uppercase text-gray-800 sm:text-sm text-center">
{/* @ts-ignore */}
                                            {category.title || "Category"}
                                        </p>
                                    </Link>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            </div>
        </section>
    );
}