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
        <section className={cn("w-full bg-[#F4F0EC] pb-10 pt-20", className)} {...props}>
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
