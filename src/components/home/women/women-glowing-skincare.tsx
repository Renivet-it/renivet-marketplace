"use client";

import { Button } from "@/components/ui/button-general";
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

export function WomenSkincare({ className, banners }: PageProps) {
    return (
        <section
        className={cn(
          "w-full py-2 md:py-12 bg-white md:bg-[#f4f0ec]",
          className
        )}
      >
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
                className="w-full h-full lg:h-[70vh] xl:h-[70vh]"
            >
                <CarouselContent
                    classNames={{
                        wrapper: "size-full",
                        inner: "size-full ml-0",
                    }}
                >
                    {banners.map((item, index) => (
                        <CarouselItem key={index} className="h-full px-2 sm:px-4 sm:px-12 py-0 lg:px-20">
                            <div className="relative size-full rounded-3xl overflow-hidden">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    fill
                                    className="object-fill sm:object-cover brightness-75"
                                    priority={index === 0}
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                                />
                                <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-6">
                                    <Button
                                        size="lg"
                                        className="bg-black text-white font-semibold uppercase rounded-full hover:bg-gray-800 py-3 px-6"
                                        asChild
                                    >
                                        <Link href={item.url || "/shop"}>Discover More</Link>
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