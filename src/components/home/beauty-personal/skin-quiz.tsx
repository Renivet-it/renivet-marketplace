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
        <section className={cn("w-full pb-10 bg-[#F4F0EC]", className)} {...props}>
            <div className="w-full max-w-[1400px] mx-auto">
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
                                <div className="relative w-full h-[1751px]">
                                    {/* Background Image */}
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        width={1400}
                                        height={1751}
                                        className="w-full h-full object-cover"
                                        priority={index === 0}
                                        quality={100}
                                    />
                                    {/* Only the Explore More Button */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Button
                                            asChild
                                            className="bg-white text-black hover:bg-gray-100 px-10 py-4 text-lg font-medium rounded-none"
                                        >
                                            <Link href={item.imageUrl || "/shop"}>
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