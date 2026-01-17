import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { HomeShopByCategory } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface PageProps extends GenericProps {
    shopByCategories: HomeShopByCategory[];
    titleData?: { title: string };
}

export function BeautyCareSection({
    className,
    shopByCategories,
    titleData,
    ...props
}: PageProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center bg-[#FCFBF4] py-6",
                className
            )}
            {...props}
        >
            <div className="mx-auto w-full max-w-screen-2xl space-y-6">
                {/* Title */}
                <h4 className="text-center text-2xl font-bold tracking-wide text-gray-800 md:text-3xl">
                    {titleData?.title || "Care Routine"}
                </h4>

                {/* Mobile Carousel (4-5 items per view) */}
                <div className="relative px-2 md:hidden">
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
                                <CarouselItem
                                    key={index}
                                    className="min-w-[80px] basis-[20%] pl-1"
                                >
                                    <Link
                                        href={category.url || "/shop"}
                                        className="block"
                                    >
                                        <div className="flex flex-col items-center p-1">
                                            <div className="w-full overflow-hidden rounded-t-lg bg-gray-100">
                                                <Image
                                                    src={category.imageUrl}
                                                    // @ts-ignore
                                                    alt={
                                                        category.title ||
                                                        "Category"
                                                    }
                                                    width={186}
                                                    height={204}
                                                    quality={85}
                                                    className="h-[80px] w-full object-cover"
                                                />
                                            </div>
                                            <div className="mt-1 w-full px-1 text-center">
                                                <p className="truncate text-[10px] font-bold uppercase text-gray-800">
                                                    {/* @ts-ignore */}
                                                    {category.title ||
                                                        "Category"}
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
                <div className="relative hidden px-6 md:block">
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {shopByCategories.map((category, index) => (
                                <CarouselItem
                                    key={index}
                                    className="basis-[200px] pl-6"
                                >
                                    <Link
                                        href={category.url || "/shop"}
                                        className="block"
                                    >
                                        <div className="flex flex-col items-center p-2 transition-shadow duration-200">
                                            <div className="w-full overflow-hidden rounded-t-[53.542px] bg-gray-100">
                                                <Image
                                                    src={category.imageUrl}
                                                    alt={"Category"}
                                                    width={186}
                                                    height={204}
                                                    quality={90}
                                                    className="h-[200px] w-full object-cover"
                                                />
                                            </div>
                                            <div className="mt-4 w-full text-center">
                                                <p className="text-base font-bold uppercase text-gray-800">
                                                    {category.title ||
                                                        "Category"}
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
