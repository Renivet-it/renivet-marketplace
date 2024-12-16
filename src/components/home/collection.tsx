"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";

const demoData = [
    {
        title: "Shirts",
        img: "https://utfs.io/a/4o4vm2cu6g/HtysHtJpctzNdXmfcmb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG",
    },
    {
        title: "T-shirts",
        img: "https://utfs.io/a/4o4vm2cu6g/HtysHtJpctzNjggAv9CmPpnZoHc5f2E4rFNLugdK3ty9ObjY",
    },
    {
        title: "Hoodies",
        img: "https://utfs.io/a/4o4vm2cu6g/HtysHtJpctzNYomR7rtw3Tk2oVEqIGCBSxlfdKnNFa10WH7c",
    },
    {
        title: "New Arrivals",
        img: "https://utfs.io/a/4o4vm2cu6g/HtysHtJpctzNVPXf8VBbpNcg6ZSKi0IGkAsjuLwQox3znmlt",
    },
    {
        title: "Festive Touches",
        img: "https://utfs.io/a/4o4vm2cu6g/HtysHtJpctzNXiY7fe3We049OUSYNxCLnRIka3FhcqBZlbsP",
    },
];

export function Collection({ className, ...props }: GenericProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center py-5 pt-10 md:px-8 md:py-10 md:pt-20",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-5xl xl:max-w-[100rem]">
                <Carousel
                    plugins={[
                        Autoplay({
                            delay: 2000,
                        }),
                    ]}
                    opts={{
                        loop: true,
                        align: "start",
                    }}
                >
                    <CarouselContent className="flex flex-row gap-4">
                        {demoData.map((item, index) => (
                            <CarouselItem
                                key={index}
                                className="text-center md:basis-1/2 lg:basis-1/4"
                            >
                                <Link href="/soon" className="space-y-4">
                                    <div className="aspect-[3/3.5]">
                                        <Image
                                            width={1000}
                                            height={1000}
                                            src={item.img}
                                            alt={item.title}
                                            className="size-full object-cover"
                                        />
                                    </div>

                                    <h3 className="text-lg font-semibold uppercase">
                                        {item.title}
                                    </h3>
                                </Link>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    );
}
