"use client";

import { Advertisement } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps {
    advertisements: Advertisement[];
}

export function DiscountOffer({ advertisements }: PageProps) {
    if (!advertisements.length) return null;

    return (
        <section className="w-full bg-[#FCFBF4]">
            <h2 className="mb-4 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                Discover Conscious, Comfortable fashion
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
                <CarouselContent className="ml-0">
                    {advertisements.map((ad, index) => (
                        <CarouselItem key={ad.id} className="w-full p-0">
                            {/* SAME AS TopCollectionBanner */}
                            <div className="relative aspect-[2.4/1] w-full">
                                <Link
                                    href={ad.url || "/shop"}
                                    target={ad.url ? "_blank" : undefined}
                                    rel={
                                        ad.url
                                            ? "noopener noreferrer"
                                            : undefined
                                    }
                                    className="block size-full"
                                >
                                    <Image
                                        src={ad.imageUrl}
                                        alt={ad.title}
                                        fill
                                        className="object-cover"
                                        priority={index === 0}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1440px"
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
