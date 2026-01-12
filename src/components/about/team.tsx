"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";

const team: {
    name: string;
    role: string;
    imageUrl: string;
}[] = [
    {
        name: "John Doe",
        role: "CEO & Founder",
        imageUrl: "https://picsum.photos/seed/1/1000/1000",
    },
    {
        name: "Jane Doe",
        role: "Creative Director",
        imageUrl: "https://picsum.photos/seed/2/1000/1000",
    },
    {
        name: "John Smith",
        role: "Artist",
        imageUrl: "https://picsum.photos/seed/3/1000/1000",
    },
    {
        name: "Jane Smith",
        role: "Marketing",
        imageUrl: "https://picsum.photos/seed/4/1000/1000",
    },
    {
        name: "William Doe",
        role: "Developer",
        imageUrl: "https://picsum.photos/seed/5/1000/1000",
    },
    {
        name: "William Smith",
        role: "Designer",
        imageUrl: "https://picsum.photos/seed/6/1000/1000",
    },
    {
        name: "Alex Doe",
        role: "Sales",
        imageUrl: "https://picsum.photos/seed/7/1000/1000",
    },
];

export function Team({ className, ...props }: GenericProps) {
    return (
        <div
            className={cn("space-y-5 pb-10 md:space-y-10", className)}
            {...props}
        >
            <h2 className="font-playfair text-balance text-center text-2xl font-semibold uppercase md:text-3xl">
                Meet our Team
            </h2>

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
                    {team.map((member, i) => (
                        <CarouselItem
                            key={i}
                            className="space-y-4 text-center md:basis-1/2 lg:basis-1/4"
                        >
                            <div className="aspect-[3/4] overflow-hidden">
                                <Image
                                    width={1000}
                                    height={1000}
                                    src={member.imageUrl}
                                    alt={member.name}
                                    className="size-full object-cover"
                                />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold uppercase">
                                    {member.name}
                                </h3>
                                <p className="text-muted-foreground">
                                    {member.role}
                                </p>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
