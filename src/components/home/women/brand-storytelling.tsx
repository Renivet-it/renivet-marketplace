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

export function BrandStoryTelling({ className, banners }: PageProps) {
    return (
        <section
            className={cn("pt-10 md:pt-16 lg:pt-20", className)}
            style={{ backgroundColor: "#f4f0ec" }}
        >
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 2000, // Slide changes every 2 seconds
                    }),
                ]}
            >
                <CarouselContent
                    classNames={{
                        wrapper: "size-full",
                        inner: "size-full ml-0",
                    }}
                >
                    {banners.map((item, index) => (
                        <CarouselItem key={index} className="h-full p-0">
                            <div className="relative size-full">
                                <Link href="/shop">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        width={1200}
                                        height={300}
                                        className="size-full object-contain brightness-100 transition-opacity duration-1000 ease-in-out"
                                        priority={index === 0}
                                    />
                                </Link>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>
    );
}