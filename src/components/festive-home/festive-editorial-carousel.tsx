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
            data-festive-section="hero"
            aria-label="Explore festive collections"
            className="relative w-full overflow-hidden bg-[#fbf4e7]"
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
                                className="relative block aspect-[2/3] overflow-hidden md:aspect-[2.87]"
                            >
                                <Image
                                    data-festive-editorial-image="true"
                                    src={slide.mobileImage}
                                    alt=""
                                    fill
                                    sizes="100vw"
                                    unoptimized
                                    className="object-cover md:hidden"
                                    priority={index === 0}
                                />
                                <Image
                                    data-festive-editorial-image="true"
                                    src={slide.desktopImage}
                                    alt=""
                                    fill
                                    sizes="(min-width: 768px) calc(100vw - 64px), 0px"
                                    unoptimized
                                    className="hidden object-cover md:block"
                                    priority={index === 0}
                                />
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="!absolute !top-1/2 !bottom-auto !left-3 !right-auto hidden !-translate-y-1/2 border-white/60 bg-black/25 text-white hover:bg-black/45 md:flex" />
                <CarouselNext className="!absolute !top-1/2 !bottom-auto !right-3 !left-auto hidden !-translate-y-1/2 border-white/60 bg-black/25 text-white hover:bg-black/45 md:flex" />
            </Carousel>
        </section>
    );
}
