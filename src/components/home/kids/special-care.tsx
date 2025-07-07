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

export function SpecialCare({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("pt-10 md:pt-16 lg:pt-20", className)} {...props}>
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
                            <div className="relative w-full aspect-[1440/600]"> {/* Maintain 1440:600 aspect ratio */}
                                <Link href="/shop" className="block size-full">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        fill // This will make the image fill the container
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1440px" // Responsive sizes
                                        className="object-cover brightness-100"
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