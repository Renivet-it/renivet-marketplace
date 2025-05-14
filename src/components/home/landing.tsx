"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import { Icons } from "../icons";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";

interface PageProps extends GenericProps {
    banners: Banner[];
}

export function Landing({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("", className)} {...props}>
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
    className="w-full h-full md:h-[70vh]"
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
                    <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={1920}
                        height={1080}
                        className="size-full object-contain brightness-50 md:object-cover" // Fix for PC
                        priority={index === 0}
                    />
                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 p-4 text-center text-background md:space-y-10">
                                    <h1 className="max-w-3xl text-balance text-3xl font-bold uppercase md:text-5xl lg:text-7xl">
                                        {item.title}
                                    </h1>

                                    <p className="max-w-xl text-balance text-background/80 md:text-lg lg:max-w-3xl lg:text-2xl">
                                        {item.description}
                                    </p>

                                    <Button
                                        size="lg"
                                        className="mt-1 bg-background/60 font-semibold uppercase text-foreground hover:bg-background/90 md:mt-0 md:py-5"
                                        asChild
                                    >
                                        <Link href="/shop">Discover More</Link>
                                    </Button>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            <Marquee autoFill speed={100} style={{ height: "auto", padding: "0.25rem 0" }}>
                <p className="text-sm">Wear Product You Value</p>
                <Icons.Heart className="size-3 fill-background md:size-4" />

                <p className="text-sm">Trace Your Product Journey</p>
                <Icons.Heart className="size-3 fill-background md:size-4" />

                <p className="text-sm">Know Your Impact</p>
                <Icons.Heart className="size-3 fill-background md:size-4" />

                <p className="text-sm">Choose Consciously</p>
                <Icons.Heart className="size-3 fill-background md:size-4" />
            </Marquee>
        </section>
    );
}
