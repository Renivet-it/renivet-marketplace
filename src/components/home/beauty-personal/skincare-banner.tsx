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

export function SkinCareBanner({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("w-full bg-[#F4F0EC]", className)} {...props}>
            <div className="container mx-auto px-0">
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
                    className="w-full overflow-hidden"
                >
                    <CarouselContent>
                        {banners.map((item, index) => (
                            <CarouselItem key={index} className="p-0">
                                <div className="relative w-full aspect-[1440/530] md:h-[530px]">
                                    <Link href={item.url || "/shop"} className="block w-full h-full">
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover md:object-fill w-full h-full"
                                            priority={index === 0}
                                            sizes="(max-width: 768px) 100vw, 1440px"
                                            quality={100}
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