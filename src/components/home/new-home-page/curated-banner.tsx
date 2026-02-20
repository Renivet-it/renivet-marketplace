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

export function CuratedBanner({ className, banners, ...props }: PageProps) {
    return (
        <>
            <h2 className="bg-[#FCFBF4] pb-6 pt-6 text-center font-playfair text-[20px] font-[400] leading-[1.3] tracking-[0.5px] text-[#6A4F38] md:text-[26px]">
                <br className="block md:hidden" /> {/* break only on mobile */}
                <span className="italic">Effortless Essentials.</span>
            </h2>

            <section
                className={cn(
                    "relative w-full overflow-hidden py-8 pb-7 md:py-8",
                    className
                )}
                {...props}
            >
                {/* Background Image */}
                <div className="absolute inset-0 -z-10">
                    <Image
                        src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNseDlfjon3bApvy2W4lj8UTcEV5GdMa0thXR6"
                        alt="Curated banner background"
                        fill
                        sizes="100vw"
                        priority
                        className="object-cover object-center"
                    />
                </div>

                {/* Optional gradient for readability */}
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>

                {/* Carousel Content */}
                <div className="relative z-10 mx-auto px-2 md:px-6">
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
                        <CarouselContent className="-ml-4">
                            {banners.map((item, index) => (
                                <CarouselItem
                                    key={index}
                                    className="basis-auto pl-4"
                                >
                                    {/* REMOVE rounded corners */}
                                    <div className="relative h-[200px] w-[160px] overflow-hidden rounded-none shadow-md md:h-[315px] md:w-[252px]">
                                        <Link
                                            href={item.url || "/shop"}
                                            className="relative block h-full w-full"
                                        >
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                fill
                                                className="rounded-none object-cover"
                                                priority={index === 0}
                                                sizes="(max-width: 768px) 160px, 252px"
                                            />
                                        </Link>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            </section>
        </>
    );
}
