"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function DollBanner({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("w-full", className)} {...props}>
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
                className="w-full bg-[#F4F0EC] h-[375px] sm:h-[500px] lg:h-[600px]"
            >
                <CarouselContent className="h-full">
                    {banners.map((item, index) => (
                        <CarouselItem key={index} className="h-full pl-0">
                            <div className="relative w-full h-full">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    width={1440}
                                    height={600}
                                    className="w-full h-full object-cover"
                                    priority={index === 0}
                                    style={{
                                        objectPosition: "center center"
                                    }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Button
                                        size="lg"
                                        className="bg-black text-white font-semibold uppercase rounded-full hover:bg-gray-800 py-3 px-8"
                                        asChild
                                    >
                                        <Link href="/shop">Shop Now</Link>
                                    </Button>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>
    );
}