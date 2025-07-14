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
                className="w-full aspect-[3/1] bg-[#F4F0EC]" // Corrected to match the image's 4:1 aspect ratio
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
                                <Link href={item.imageUrl || "/shop"}>
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        width={1200} // Image's actual width
                                        height={300} // Image's actual height
                                        className="size-full object-contain brightness-100"
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