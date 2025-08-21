"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Icons } from "../../icons";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";
import { Button } from "../../ui/button-general"; // Assuming a Button component exists

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function MiddleAnimationSection({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn(className)} {...props}>
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
                className="w-full aspect-[3/1] bg-[#F4F0EC]"
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
                                <Link href={item.url || "/shop"}>
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        width={1200}
                                        height={300}
                                        className="size-full object-contain brightness-100"
                                        priority={index === 0}
                                    />
                                </Link>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <Button className="bg-[#F4F0EC] text-black font-semibold px-6 py-3 rounded-md shadow hover:bg-gray-200 transition" asChild variant="default" size="lg">
                                        <Link href={item.url || "/shop"}>
                                            Explore Now
                                        </Link>
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