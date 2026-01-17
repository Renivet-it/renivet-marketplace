"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../../ui/button-general";
import { Carousel, CarouselContent, CarouselItem } from "../../ui/carousel";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function SkinQuizBanner({ className, banners, ...props }: PageProps) {
    return (
        <section
            className={cn("w-full bg-[#FCFBF4] pb-10", className)}
            {...props}
        >
            <div className="mx-auto w-full max-w-[1400px]">
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
                    className="w-full overflow-hidden"
                >
                    <CarouselContent>
                        {banners.map((item, index) => (
                            <CarouselItem key={index} className="p-0">
                                <div className="relative h-[1751px] w-full">
                                    {/* Background Image */}
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        width={1400}
                                        height={1751}
                                        className="h-full w-full object-cover"
                                        priority={index === 0}
                                        quality={100}
                                    />
                                    {/* Only the Explore More Button */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Button
                                            asChild
                                            className="rounded-none bg-white px-10 py-4 text-lg font-medium text-black hover:bg-gray-100"
                                        >
                                            <Link href={item.url || "/shop"}>
                                                Explore More
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}
