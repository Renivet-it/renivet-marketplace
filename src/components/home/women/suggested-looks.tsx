"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps {
    banners: Banner[];
    className?: string;
}

export function SuggestedLook({ className, banners }: PageProps) {
    return (
        <section
            className={cn("w-full bg-[#FCFBF4] pt-10 lg:pt-20", className)}
            style={{ backgroundColor: "#FCFBF4" }}
        >
            {/* Centered Title Section */}
            <div className="mb-6 flex w-full justify-center">
                <div className="w-full max-w-screen-2xl px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                        Suggested Looks
                    </h2>
                </div>
            </div>

            {/* Full-width Carousel */}
            <div className="w-screen">
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    plugins={[
                        Autoplay({
                            delay: 5000,
                        }),
                    ]}
                    className="w-full"
                >
                    <CarouselContent className="ml-0">
                        {banners.map((item, index) => (
                            <CarouselItem key={index} className="h-full p-0">
                                <div className="relative h-full w-full">
                                    <Link
                                        href={item.url || "/shop"}
                                        className="block size-full"
                                    >
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            width={1440}
                                            height={300}
                                            className="h-full w-full object-cover"
                                            priority={index === 0}
                                            sizes="100vw"
                                        />
                                    </Link>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}
