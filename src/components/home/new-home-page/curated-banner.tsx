"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "../../icons";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function CuratedBanner({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("w-full pt-8 md:pt-12 bg-[#F4F0EC]", className)} {...props}>
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
                        <CarouselItem key={index} className="p-0">
                            <div className="relative w-full" style={{ aspectRatio: "1440/300" }}>
                                <Link href={item.url || "/shop"} className="block w-full h-full">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                        priority={index === 0}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1440px"
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