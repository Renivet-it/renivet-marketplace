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
            <h2 className="mb-2 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                Tradition, Tailored for Children
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
                className="aspect-[1440/700] w-full bg-[#FCFBF4] sm:min-h-[400px] lg:min-h-[700px]"
            >
                <CarouselContent className="ml-0">
                    {advertisements.map((ad, index) => (
                        <CarouselItem key={ad.id} className="p-0">
                            <div className="relative h-full w-full">
                                {ad.url ? (
                                    <Link
                                        href={ad.url}
                                        target="_blank"
                                        className="block size-full"
                                    >
                                        <Image
                                            src={ad.imageUrl}
                                            alt={ad.title}
                                            width={1440}
                                            height={700}
                                            className="size-full object-cover brightness-100"
                                            priority={index === 0}
                                        />
                                        {/* Shop Now Button */}
                                        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8">
                                            <button className="rounded-full bg-white px-6 py-2 text-sm font-bold text-gray-900 shadow-lg transition-colors duration-300 hover:bg-gray-100 md:px-8 md:py-3 md:text-base">
                                                Shop Now
                                            </button>
                                        </div>
                                    </Link>
                                ) : (
                                    <div className="size-full">
                                        <Image
                                            src={ad.imageUrl}
                                            alt={ad.title}
                                            width={1440}
                                            height={700}
                                            className="size-full object-cover brightness-100"
                                            priority={index === 0}
                                        />
                                        {/* Shop Now Button */}
                                        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8">
                                            <button className="rounded-full bg-white px-6 py-2 text-sm font-bold text-gray-900 shadow-lg transition-colors duration-300 hover:bg-gray-100 md:px-8 md:py-3 md:text-base">
                                                Shop Now
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>
    );
}
