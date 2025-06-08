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

export function WomenSkincare({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("", className)} {...props}>
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
                        <CarouselItem key={index} className="h-full px-12 py-6 lg:px-20">
                            <div className="relative size-full rounded-3xl overflow-hidden">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    width={1920}
                                    height={1080}
                                    className="size-full object-cover brightness-75"
                                    priority={index === 0}
                                />
                                <div className="absolute inset-0 flex items-center justify-center p-6">
                                    <Button
                                        size="lg"
                                        className="hidden md:block bg-black text-white font-semibold uppercase rounded-full hover:bg-gray-800 md:py-3 md:px-6"
                                        asChild
                                    >
                                        <Link href="/shop">Discover More</Link>
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