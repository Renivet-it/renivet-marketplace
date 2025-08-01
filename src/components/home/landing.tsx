"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
import { Home, ChevronRight } from "lucide-react";
import { Icons } from "@/components/icons";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
    const aspectRatio = 1440 / 500; // Calculate the aspect ratio

    return (
        <section className={cn("bg-[#F4F0EC]", className)} {...props}>
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
                className="w-full bg-[#F4F0EC]"
            >
                <CarouselContent
                    classNames={{
                        wrapper: "size-full",
                        inner: "size-full ml-0",
                    }}
                >
                    {banners.map((item, index) => (
                        <CarouselItem key={index} className="px-0 py-0">
                            <div
                                className="relative w-full overflow-hidden bg-gray-100"
                                style={{
                                    // Maintain the aspect ratio
                                    paddingBottom: `${(1 / aspectRatio) * 100}%`
                                }}
                            >
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    width={1440}
                                    height={550}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    priority={index === 0}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-end pb-16">
                                    <Button
                                        size="lg"
                                        className="bg-transparent text-black font-medium uppercase tracking-wider rounded-none border-2 border-black hover:bg-black hover:text-white transition-colors duration-300 py-3 px-8 text-sm"
                                        asChild
                                    >
                                        <Link href={item.url || "/shop"}> {">"} EXPLORE NOW</Link>
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