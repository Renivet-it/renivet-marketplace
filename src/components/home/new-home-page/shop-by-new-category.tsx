import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import React from "react";

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
                "flex w-full justify-center bg-[#FCFBF4] py-10",
                className
            )}
            {...props}
        >
            <div className="mx-auto w-full max-w-screen-2xl space-y-8 px-4">
                {/* Title */}
                <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                    {titleData?.title || "Shop by Category"}
                </h2>

                {/* ========================================================== */}
                {/* 🔹 MOBILE-ONLY VIEW (Two-Row Scrolling Carousel)        */}
                {/* ========================================================== */}
                <div className="flex flex-col gap-4 px-2 md:hidden">
                    {/* First Row */}
                    <div className="scrollbar-hide flex gap-3 overflow-x-auto">
                        {firstRowItems.map((category, index) => (
                            <Link
                                key={`row1-${index}`}
                                href={category.url || "/shop"}
                                className="block w-[110px] flex-shrink-0" // Set fixed width and prevent shrinking
                            >
                                <div className="flex w-full flex-col items-center rounded-md bg-gradient-to-b from-[#E8E8E8] to-[#F5F5F5] p-2">
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm">
                                        <Image
                                            src={category.imageUrl}
                                            alt={category.title || "Category"}
                                            fill
                                            quality={85}
                                            className="object-cover"
                                            sizes="110px"
                                        />
                                    </div>
                                    <div className="mt-2 w-full space-y-0.5 text-center">
                                        <p className="truncate text-xs font-bold text-gray-800">
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
                    <div className="scrollbar-hide flex gap-3 overflow-x-auto">
                        {secondRowItems.map((category, index) => (
                            <Link
                                key={`row2-${index}`}
                                href={category.url || "/shop"}
                                className="block w-[110px] flex-shrink-0"
                            >
                                <div className="flex w-full flex-col items-center rounded-md bg-gradient-to-b from-[#E8E8E8] to-[#F5F5F5] p-2">
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm">
                                        <Image
                                            src={category.imageUrl}
                                            alt={category.title || "Category"}
                                            fill
                                            quality={85}
                                            className="object-cover"
                                            sizes="110px"
                                        />
                                    </div>
                                    <div className="mt-2 w-full space-y-0.5 text-center">
                                        <p className="truncate text-xs font-bold text-gray-800">
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
                        <div
                            key={chunkIndex}
                            className="mb-6 grid grid-cols-6 gap-4 px-2"
                        >
                            {chunk.map((category, index) => (
                                <Link
                                    key={index}
                                    href={category.url || "/shop"}
                                    className="block"
                                >
                                    <div className="flex h-[257px] w-[182px] flex-col items-center bg-gradient-to-b from-[#E8E8E8] to-[#c6ced0] p-3 transition-shadow duration-200 hover:shadow-md">
                                        <div className="relative h-[180px] w-full">
                                            <Image
                                                src={category.imageUrl}
                                                alt={
                                                    category.title || "Category"
                                                }
                                                fill
                                                sizes="180px"
                                                quality={90}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="mt-4 w-full space-y-1 text-center">
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
