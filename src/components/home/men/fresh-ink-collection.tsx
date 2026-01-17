"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function FreshInkCollection({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("w-full bg-[#FCFBF4] pb-2 pt-8", className)} {...props}>
                            <h2 className="text-center font-[400] text-[18px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#7A6338] font-playfair mb-4">
Built for Comfort. Made to Last.
</h2>
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
                <CarouselContent
                    classNames={{
                        wrapper: "w-full h-full",
                        inner: "w-full h-full ml-0",
                    }}
                >
                    {banners.map((item, index) => (
                        <CarouselItem key={index} className="w-full p-0">
                            <div className="relative w-full">
                                <Link href={item.url || "/shop"}>
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        width={1920}
                                        height={600}
                                        className="w-full h-auto object-contain"
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
