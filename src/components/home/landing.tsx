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
        title: "Making a Choice",
        description:
            "A choice that is good for you and the planet. Discover our sustainable products.",
        imageUrl:
            "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZn9M1CYRgtC81g0yM5IoNfltURbp4rs2XnFQOT",
        button: "Discover More",
        href: "/soon",
    },
    {
        title: "Nurture Nature",
        description:
            "The best way to protect the environment is to make sustainable choices.",
        imageUrl:
            "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnMBwj2mdNari256c8ReoWJUD0Pyg3ZdX7Yqpb",
        button: "Discover More",
        href: "/soon",
    },
    {
        title: "From Raw to Remarkable",
        description:
            "From raw materials to remarkable products, we are committed to sustainability.",
        imageUrl:
            "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZntdsqdSIHmgvafVRtSkxXNwjCWPu2LqAG3Fly",
        button: "Discover More",
        href: "/soon",
    },
    {
        title: "Earthy Warmth Naturally Inspired",
        description:
            "Our products are inspired by nature and designed to bring warmth to your home.",
        imageUrl:
            "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnC4U1le5EGLspIcX2SViB8tOyhJe6n7fF3RWj",
        button: "Discover More",
        href: "/soon",
    },
    {
        title: "Drip of Elegance",
        description:
            "Discover our elegant and eco-friendly products that are designed to make a statement.",
        imageUrl:
            "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnV6qCG7l80TM4AsehRfmtqSxKLIbUCcJay9gN",
        button: "Discover More",
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
                className="h-[calc(100vh-20vh)] w-full"
            >
                <CarouselContent className="ml-0">
                    {items.map((item, index) => (
                        <CarouselItem key={index} className="h-full p-0">
                            <div className="relative size-full">
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title}
                                    width={2000}
                                    height={2000}
                                    className="size-full object-cover brightness-50"
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
