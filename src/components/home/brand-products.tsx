"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { HomeBrandProduct } from "@/lib/validations";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    brandProducts: HomeBrandProduct[];
}

export function BrandProducts({
    className,
    brandProducts,
    ...props
}: PageProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center py-5 md:px-8 md:py-10",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-5xl xl:max-w-[100rem]">
                <Carousel
                    plugins={[
                        Autoplay({
                            delay: 5000,
                        }),
                    ]}
                    opts={{
                        loop: true,
                        align: "start",
                    }}
                >
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {brandProducts.map((item, index) => (
                            <CarouselItem
                                key={index}
                                className="pl-2 md:basis-1/3 md:pl-4 lg:basis-1/6"
                            >
                                <Link
                                    href={item.url || "/shop"}
                                    className="block"
                                >
                                    <div className="aspect-[4/5] overflow-hidden">
                                        <Image
                                            src={item.imageUrl}
                                            alt={`Brand Product ${index + 1}`}
                                            width={200}
                                            height={200}
                                            className="size-full object-cover"
                                        />
                                    </div>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    <CarouselPrevious className="left-0 h-full rounded-none border-none bg-gradient-to-r from-background to-transparent hover:from-background hover:to-transparent" />
                    <CarouselNext className="right-0 h-full rounded-none border-none bg-gradient-to-l from-background to-transparent" />
                </Carousel>
            </div>
        </section>
    );
}
