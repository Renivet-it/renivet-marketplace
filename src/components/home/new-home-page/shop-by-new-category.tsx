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
    titleData?: { title: string };
}

export function ShopByNewCategories({
    className,
    shopByCategories,
    titleData,
    ...props
}: PageProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center py-6",
                className
            )}
            {...props}
        >
            <div className="w-full space-y-6 max-w-screen-2xl mx-auto">
                {/* Title */}
                <h2 className="text-center text-2xl md:text-3xl font-bold uppercase tracking-wide text-gray-800">
                    {titleData?.title || "Shop by Category"}
                </h2>

                {/* Mobile View (3 full cards) */}
                <div className="md:hidden grid auto-cols-[calc(33.333%-8px)] grid-flow-col gap-3 overflow-x-auto px-2 scrollbar-hide">
                    {shopByCategories.map((category, index) => (
                        <Link
                            key={index}
                            href={category.url || "/shop"}
                            className="block"
                        >
                            <div className="flex flex-col items-center bg-gray-50 rounded-md p-2 w-full">
                                <div className="overflow-hidden rounded-md w-full">
                                    <Image
                                        src={category.imageUrl}
                                        alt={"Category"}
                                        width={150}
                                        height={180}
                                        quality={85}
                                        className="h-[180px] w-full object-cover"
                                    />
                                </div>
                                <div className="mt-3 text-center w-full">
                                    <p className="text-sm font-bold text-gray-800">
                    {/* @ts-ignore */}
                                        {category.title || "Category"}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-xs hover:underline",
                                            index === 0 ? "text-blue-600 font-semibold" : "text-gray-500"
                                        )}
                                    >
                                        {index === 0 ? "Shop Now!" : "Shop"}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Desktop View (Wider Carousel) */}
                <div className="hidden md:block px-6">
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {shopByCategories.map((category, index) => (
                                <CarouselItem key={index} className="pl-6 basis-[280px]">
                                    <Link href={category.url || "/shop"} className="block">
                                        <div className="flex flex-col items-center bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                                            <div className="overflow-hidden rounded-lg w-full">
                                                <Image
                                                    src={category.imageUrl}
                                                    alt={ "Category"}
                                                    width={260}
                                                    height={260}
                                                    quality={90}
                                                    className="h-[260px] w-full object-cover"
                                                />
                                            </div>
                                            <div className="mt-4 text-center w-full">
                                                <p className="text-base font-bold text-gray-800">
                    {/* @ts-ignore */}
                                                    { "Category"}
                                                </p>
                                                <p
                                                    className={cn(
                                                        "text-sm hover:underline mt-1",
                                                        index === 0 ? "text-blue-600 font-semibold" : "text-gray-500"
                                                    )}
                                                >
                                                    {index === 0 ? "Shop Now!" : "Shop"}
                                                </p>
                                            </div>
                                        </div>
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