"use client";

import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";

interface Item {
    title: string;
    description: string;
    imageUrl: string;
    button: string;
    href: string;
}

const items: Item[] = [
    {
        title: "Lorem ipsum",
        description:
            "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Voluptate delectus aut autem est, repellat nulla optio adipisci cum natus inventore.",
        imageUrl: "/banner_1.jpg",
        button: "Discover More",
        href: "/soon",
    },
    {
        title: "dolor sit",
        description:
            "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Eos nam dolore cumque quos magni maxime molestiae nostrum corporis.",
        imageUrl: "/banner_2.jpeg",
        button: "Learn More",
        href: "/soon",
    },
    {
        title: "adipisicing elit",
        description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate delectus aut autem est, repellat nulla optio adipisci.",
        imageUrl: "/banner_3.jpeg",
        button: "Get Started",
        href: "/soon",
    },
    {
        title: "Voluptate delectus",
        description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate delectus aut autem est, repellat nulla optio adipisci cum natus inventore.",
        imageUrl: "/banner_4.jpeg",
        button: "Discover More",
        href: "/soon",
    },
    {
        title: "amet consectetur",
        description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptate delectus aut autem est, repellat nulla optio adipisci natus inventore.",
        imageUrl: "/banner_5.jpg",
        button: "Explore",
        href: "/soon",
    },
];

export function Landing({ className, ...props }: GenericProps) {
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
                className="h-[calc(100vh-70px)] w-full"
            >
                <CarouselContent className="ml-0">
                    {items.map((item, index) => (
                        <CarouselItem key={index} className="h-full p-0">
                            <div className="relative size-full">
                                <Image
                                    src={`/home/landing/banners${item.imageUrl}`}
                                    alt={item.title}
                                    width={2000}
                                    height={2000}
                                    className="size-full object-cover brightness-50"
                                    priority={index === 0}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 p-4 text-center text-background md:space-y-10">
                                    <h1 className="text-balance text-3xl font-bold uppercase md:text-5xl lg:text-7xl">
                                        {item.title}
                                    </h1>

                                    <p className="max-w-xl text-balance text-background/80 md:text-lg lg:max-w-3xl lg:text-2xl">
                                        {item.description}
                                    </p>

                                    <Button
                                        size="lg"
                                        className="mt-1 bg-background font-semibold uppercase text-foreground hover:bg-background/90 md:mt-0 md:py-7 md:text-lg"
                                        asChild
                                    >
                                        <Link href={item.href}>
                                            {item.button}
                                        </Link>
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
