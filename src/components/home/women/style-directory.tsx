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

export function StyleDirectory({
    className,
    shopByCategories,
    titleData,
    ...props
}: PageProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center py-6 bg-[#F4F0EC]",
                className
            )}
            {...props}
        >
            <div className="w-full space-y-6 max-w-screen-2xl mx-auto">
                {/* Title */}
                <h4 className="text-center text-2xl md:text-3xl font-bold tracking-wide text-gray-800">
                    {titleData?.title || "Style Directory"}
                </h4>

                {/* Mobile Carousel (4-5 items per view) */}
                <div className="md:hidden px-2 relative">
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                            slidesToScroll: 4,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-1">
                            {shopByCategories.map((category, index) => (
                                <CarouselItem key={index} className="pl-1 basis-[20%] min-w-[80px]">
                                    <Link href={category.url || "/shop"} className="block">
                                        <div className="flex flex-col items-center p-1">
                                            <div className="overflow-hidden w-full bg-gray-100 rounded-t-lg">
                                                <Image
                                                    src={category.imageUrl}
      // @ts-ignore
                                                    alt={category.title || "Category"}
                                                    width={186}
                                                    height={204}
                                                    quality={85}
                                                    className="h-[80px] w-full object-cover"
                                                />
                                            </div>
                                            <div className="mt-1 text-center w-full px-1">
                                                <p className="text-[10px] font-bold text-gray-800 uppercase truncate">
      {/* @ts-ignore */}
                                                    {category.title || "Category"}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>

                {/* Desktop Carousel */}
                <div className="hidden md:block px-6 relative">
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {shopByCategories.map((category, index) => (
                                <CarouselItem key={index} className="pl-6 basis-[200px]">
                                    <Link href={category.url || "/shop"} className="block">
                                        <div className="flex flex-col items-center p-2 transition-shadow duration-200">
                                            <div className="overflow-hidden w-full bg-gray-100 rounded-t-[53.542px]">
                                                <Image
                                                    src={category.imageUrl}
                                                    alt={"Category"}
                                                    width={186}
                                                    height={204}
                                                    quality={90}
                                                    className="h-[200px] w-full object-cover"
                                                />
                                            </div>
                                            <div className="mt-4 text-center w-full">
                                                <p className="text-base font-bold text-gray-800 uppercase">
                                                    {"Category"}
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