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

export function NurtureBanner({ className, banners, ...props }: PageProps) {
    return (
        <section
            className={cn("w-full bg-[#FCFBF4] pt-8 md:pt-12", className)}
            {...props}
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
                className="mx-auto h-auto w-full max-w-[1380px] md:h-[500px]"
            >
                <CarouselContent
                    classNames={{
                        wrapper: "size-full",
                        inner: "size-full ml-0",
                    }}
                >
                    {banners.map((item, index) => (
                        <CarouselItem key={index} className="h-full p-0">
                            <div className="relative h-[50vw] w-full md:aspect-[1380/500] md:h-[500px]">
                                <Link
                                    href={item.url || "/shop"}
                                    className="block h-full w-full"
                                >
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill
                                        className="h-full w-full object-contain brightness-100 md:object-cover"
                                        priority={index === 0}
                                        sizes="(max-width: 768px) 100vw, 1380px"
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
