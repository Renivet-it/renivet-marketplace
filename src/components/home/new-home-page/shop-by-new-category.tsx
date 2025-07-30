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
    // Function to split categories into chunks of 6 for desktop view
    const chunkArray = (arr: any[], size: number) => {
        return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size)
        );
    };

    const desktopChunks = chunkArray(shopByCategories, 6);

    return (
        <section
            className={cn(
                "flex w-full bg-[#F4F0EC] justify-center py-10",
                className
            )}
            {...props}
        >
            <div className="w-full space-y-8 max-w-screen-2xl mx-auto px-4">
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
                            <div className="flex flex-col items-center bg-gradient-to-b from-[#E8E8E8] to-[#F5F5F5] p-2 w-full">
                                <div className="relative w-full aspect-[2/3]">
                                    <Image
                                        src={category.imageUrl}
                                        alt={"Category"}
                                        fill
                                        quality={85}
                                        className="object-cover"
                                    />
                                </div>
                                <div className="mt-3 text-center w-full space-y-1">
                                    <p className="text-sm font-bold text-gray-800">
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

                {/* Desktop View (Grid with rows of 6 items) */}
                <div className="hidden md:block">
                    {desktopChunks.map((chunk, chunkIndex) => (
                        <div key={chunkIndex} className="grid grid-cols-6 gap-4 mb-6 px-2">
                            {chunk.map((category, index) => (
                                <Link
                                    key={index}
                                    href={category.url || "/shop"}
                                    className="block"
                                >
                                    <div className="flex flex-col items-center bg-gradient-to-b from-[#E8E8E8] to-[#c6ced0] p-3 hover:shadow-md transition-shadow duration-200 h-[257px] w-[182px]">
                                        <div className="relative w-full h-[180px]">
                                            <Image
                                                src={category.imageUrl}
                                                alt={"Category"}
                                                fill
                                                quality={90}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="mt-4 text-center w-full space-y-1">
                                            <p className="text-sm font-bold text-gray-800">
                                                {category.title || "Category"}
                                            </p>
                                            <p
                                                className={cn(
                                                    "text-xs hover:underline",
                                                    index === 0 && chunkIndex === 0 ? "text-blue-600 font-semibold" : "text-gray-500"
                                                )}
                                            >
                                                {index === 0 && chunkIndex === 0 ? "Shop Now!" : "Shop"}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}