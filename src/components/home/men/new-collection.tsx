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

export function NewCollection({ className, banners, ...props }: PageProps) {
    return (
        <section
            className={cn(
                "bg-white pb-10 pt-10 md:pb-16 md:pt-16 lg:pb-20 lg:pt-20",
                className
            )}
            {...props}
        >
            <h2 className="mb-10 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
                New Collection
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
                        wrapper: "size-full",
                        inner: "size-full ml-0",
                    }}
                >
                    {banners.map((item, index) => (
                        <CarouselItem key={index} className="h-full p-0">
                            <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-2xl md:min-h-[500px] lg:min-h-[600px]">
                                <Link
                                    href={item.url || "/shop"}
                                    className="block size-full"
                                >
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                        priority={index === 0}
                                        sizes="100vw"
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
