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

export function BestSellerBanner({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("w-full pt-4 md:pt-4 bg-[#F4F0EC]", className)} {...props}>
            <h2 className="text-center font-[400] text-[18px] md:text-[26px] leading-[1.3] tracking-[0.5px] text-[#7A6338] font-playfair mb-2">
 Essentials for a Greener Everyday
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
                className="w-full h-auto md:h-[750px]"
            >
                <CarouselContent
                    classNames={{
                        wrapper: "size-full",
                        inner: "size-full ml-0",
                    }}
                >
                    {banners.map((item, index) => (
                        <CarouselItem key={index} className="h-full p-0">
                            <div className="relative w-full aspect-[1400/600]">
                                <Link href={item.url || "/shop"} className="block w-full h-full">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="object-cover w-full h-full brightness-100"
                                        priority={index === 0}
                                        sizes="(max-width: 768px) 100vw, 1400px"
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