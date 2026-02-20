"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

interface MoodboardItem {
    id: string;
    imageUrl: string;
    url?: string;
}

interface PageProps {
    moodboardItems: MoodboardItem[];
    className?: string;
}

export function BrandPromotion({ moodboardItems, className }: PageProps) {
    if (!moodboardItems?.length) return null;

    return (
        <section className={cn("w-full bg-[#FCFBF4] px-4 py-4", className)}>
            <div className="mx-auto max-w-[1600px]">
                {/* ========================= TITLE ========================= */}
                <h2 className="mb-6 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                    Handmade Stories from Across India
                </h2>

                {/* ========================= DESKTOP CAROUSEL ========================= */}
                <div className="hidden md:block">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 3500,
                            }),
                        ]}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {moodboardItems.map((item) => (
                                <CarouselItem
                                    key={item.id}
                                    className="mr-6 basis-auto pl-4" // ← added mr-6 for spacing
                                    style={{ width: "411px" }} // EXACT WIDTH
                                >
                                    <Link
                                        href={item.url || "/shop"}
                                        className="relative block h-[500px] w-[411px] overflow-hidden border border-[#D8D2C7]"
                                    >
                                        <Image
                                            src={item.imageUrl}
                                            alt="Story Image"
                                            fill
                                            sizes="411px"
                                            className="object-cover"
                                        />
                                    </Link>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>

                {/* ========================= MOBILE CAROUSEL ========================= */}
                <div className="md:hidden">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 3500,
                            }),
                        ]}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-3">
                            {moodboardItems.map((item) => (
                                <CarouselItem
                                    key={item.id}
                                    className="mr-6 basis-auto pl-4" // ← added mr-6 for spacing
                                    style={{ width: "260px" }}
                                >
                                    <Link
                                        href={item.url || "/shop"}
                                        className="relative block h-[330px] w-[260px] overflow-hidden border border-[#D8D2C7]"
                                    >
                                        <Image
                                            src={item.imageUrl}
                                            alt="Story Card"
                                            fill
                                            sizes="260px"
                                            className="object-cover"
                                        />
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
