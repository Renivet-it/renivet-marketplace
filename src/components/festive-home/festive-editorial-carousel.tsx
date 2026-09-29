"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { FESTIVE_EDITORIAL_SLIDES } from "@/lib/festive/editorial-carousel";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

export function FestiveEditorialCarousel() {
    return (
        <section
            data-festive-section="editorial-cards"
            aria-label="Explore festive collections"
            className="bg-[#fff9eb] px-3 pb-10 pt-8 md:px-8 md:pb-12 md:pt-0"
        >
            <Carousel
                opts={{ loop: true }}
                plugins={[
                    Autoplay({
                        delay: 5000,
                        stopOnInteraction: false,
                        stopOnMouseEnter: true,
                    }),
                ]}
                className="group/festive-editorial"
            >
                <CarouselContent className="-ml-0">
                    {FESTIVE_EDITORIAL_SLIDES.map((slide, index) => (
                        <CarouselItem key={slide.href} className="pl-0">
                            <Link
                                href={slide.href}
                                aria-label={`Explore festive collection ${index + 1}`}
                                className="relative block aspect-[0.94] overflow-hidden md:aspect-[2.45]"
                            >
                                <Image
                                    data-festive-editorial-image="true"
                                    src={slide.mobileImage}
                                    alt=""
                                    fill
                                    sizes="100vw"
                                    className="object-cover md:hidden"
                                    priority={index === 0}
                                />
                                <Image
                                    data-festive-editorial-image="true"
                                    src={slide.desktopImage}
                                    alt=""
                                    fill
                                    sizes="(min-width: 768px) calc(100vw - 64px), 0px"
                                    className="hidden object-cover md:block"
                                    priority={index === 0}
                                />
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-3 hidden border-white/60 bg-black/25 text-white hover:bg-black/45 md:flex" />
                <CarouselNext className="right-3 hidden border-white/60 bg-black/25 text-white hover:bg-black/45 md:flex" />
            </Carousel>
        </section>
    );
}
