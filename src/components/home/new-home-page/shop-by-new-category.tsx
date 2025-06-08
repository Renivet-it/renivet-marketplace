import React from 'react'; // Add this if using React <17
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
                "flex w-full justify-center py-4",
                className
            )}
            {...props}
        >
            <div className="w-full space-y-4 max-w-screen-xl mx-auto">
                {/* Title */}
                <h2 className="text-center text-[20px] font-bold uppercase tracking-wide text-gray-800">
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
                                        alt={category.title || "Category"}
                                        width={150}
                                        height={180}
                                        quality={85}
                                        className="h-[180px] w-full object-cover"
                                    />
                                </div>
                                <div className="mt-3 text-center w-full">
                                    <p className="text-[14px] font-bold text-gray-800">
                                        {category.title || "Category"}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-[12px] hover:underline",
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

                {/* Desktop View (Carousel) */}
                <div className="hidden md:block px-4">
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-2">
                            {shopByCategories.map((category, index) => (
                                <CarouselItem key={index} className="pl-4 basis-[220px]">
                                    <Link href={category.url || "/shop"} className="block">
                                        <div className="flex flex-col items-center bg-gray-50 rounded-md p-2 hover:shadow-md transition-shadow duration-200">
                                            <div className="overflow-hidden rounded-md w-full">
                                                <Image
                                                    src={category.imageUrl}
                                                    alt={category.title || "Category"}
                                                    width={200}
                                                    height={200}
                                                    quality={85}
                                                    className="h-[200px] w-full object-cover"
                                                />
                                            </div>
                                            <div className="mt-3 text-center w-full">
                                                <p className="text-[15px] font-bold text-gray-800">
                                                    {category.title || "Category"}
                                                </p>
                                                <p
                                                    className={cn(
                                                        "text-[13px] hover:underline",
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