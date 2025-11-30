import React from "react";
import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

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
    // --- DATA PREPARATION ---
    // Function to split categories for desktop view
    const chunkArray = (arr: any[], size: number) => {
        return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size)
        );
    };
    const desktopChunks = chunkArray(shopByCategories, 6);

    // Split categories for the two-row mobile carousel
    const midIndex = Math.ceil(shopByCategories.length / 2);
    const firstRowItems = shopByCategories.slice(0, midIndex);
    const secondRowItems = shopByCategories.slice(midIndex);

    return (
        <section
            className={cn(
                "flex w-full bg-[#fbfaf4] justify-center py-10",
                className
            )}
            {...props}
        >
            <div className="w-full space-y-8 max-w-screen-2xl mx-auto px-4">
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 border-gray-300 pb-2 px-4">
                    {titleData?.title || "Shop by Category"}
                </h2>

                {/* ========================================================== */}
                {/* 🔹 MOBILE-ONLY VIEW (Two-Row Scrolling Carousel)        */}
                {/* ========================================================== */}
                <div className="md:hidden flex flex-col gap-4 px-2">
                    {/* First Row */}
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                        {firstRowItems.map((category, index) => (
                            <Link
                                key={`row1-${index}`}
                                href={category.url || "/shop"}
                                className="block w-[110px] flex-shrink-0" // Set fixed width and prevent shrinking
                            >
                                <div className="flex flex-col items-center bg-gradient-to-b from-[#E8E8E8] to-[#F5F5F5] p-2 w-full rounded-md">
                                    <div className="relative w-full aspect-[2/3] rounded-sm overflow-hidden">
                                        <Image
                                            src={category.imageUrl}
                                            alt={category.title || "Category"}
                                            fill
                                            quality={85}
                                            className="object-cover"
                                            sizes="110px"
                                        />
                                    </div>
                                    <div className="mt-2 text-center w-full space-y-0.5">
                                        <p className="text-xs font-bold text-gray-800 truncate">
                                            {category.title || "Category"}
                                        </p>
                                        <p className="text-[10px] text-gray-500 hover:underline">
                                            Shop
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    {/* Second Row */}
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                        {secondRowItems.map((category, index) => (
                            <Link
                                key={`row2-${index}`}
                                href={category.url || "/shop"}
                                className="block w-[110px] flex-shrink-0"
                            >
                                <div className="flex flex-col items-center bg-gradient-to-b from-[#E8E8E8] to-[#F5F5F5] p-2 w-full rounded-md">
                                    <div className="relative w-full aspect-[2/3] rounded-sm overflow-hidden">
                                        <Image
                                            src={category.imageUrl}
                                            alt={category.title || "Category"}
                                            fill
                                            quality={85}
                                            className="object-cover"
                                            sizes="110px"
                                        />
                                    </div>
                                    <div className="mt-2 text-center w-full space-y-0.5">
                                        <p className="text-xs font-bold text-gray-800 truncate">
                                            {category.title || "Category"}
                                        </p>
                                        <p className="text-[10px] text-gray-500 hover:underline">
                                            Shop
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ========================================================== */}
                {/* 🔹 DESKTOP-ONLY VIEW (Original code, untouched)         */}
                {/* ========================================================== */}
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
                                                alt={category.title || "Category"}
                                                fill
                                                quality={90}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="mt-4 text-center w-full space-y-1">
                                            <p className="text-sm font-bold text-gray-800">
                                                {category.title || "Category"}
                                            </p>
                                            <p className="text-xs text-gray-500 hover:underline">
                                                Shop
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
