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

export function ElavateYourLooks ({
    className,
    shopByCategories,
    title = "Elevate Your Look",
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
                <h2 className="text-center text-3xl font-bold uppercase text-gray-900 mb-12">
                    {title}
                </h2>

                {/* Carousel */}
                <div className="px-2">
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {shopByCategories.map((category, index) => (
                                <CarouselItem key={index} className="pl-4 basis-[220px]">
                                    <Link 
                                        href={category.url || "/shop"} 
                                        className="group flex flex-col items-center w-full"
                                    >
                                        <div className="rounded-lg overflow-hidden w-[200px] h-[200px] mb-4 border border-gray-200 group-hover:border-gray-400 transition-colors">
                                            <Image
                                                src={category.imageUrl}
                                                alt={category.title || "Category"}
                                                width={200}
                                                height={200}
                                                quality={100}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <p className="text-lg font-medium uppercase text-gray-800">
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