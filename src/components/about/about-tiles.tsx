"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import Image from "next/image";

const tiles: {
    title: string;
    description: string;
    imageUrl: string;
}[] = [
    {
        title: "#1",
        description:
            "At Renivet, we’re on a mission to make sustainability more than a trend—it’s a commitment to shaping a future built on quality, longevity, and mindful choices. Inspired by our founder’s journey through Europe, where sustainable living became a way of life, Renivet was born from the vision of bringing meaningful change into everyday choices.",
        imageUrl: "https://picsum.photos/seed/1910/1000/1000",
    },
    {
        title: "#2",
        description:
            "Renivet is more than a marketplace; it’s a movement. We curate high-quality, sustainable products crafted with care, designed to enrich your life while respecting the planet. Rooted in the principles of circularity, our platform ensures each item lives multiple lives, reducing waste and supporting a zero-waste future.",
        imageUrl: "https://picsum.photos/seed/1990/1000/1000",
    },
    {
        title: "#3",
        description:
            "As part of our commitment to circularity, Renivet seeks to redefine the life cycle of products by embedding them into a continuous loop of renewal and reusability. By encouraging a system where products are recycled, repurposed, and reimagined, we aspire to reduce the environmental footprint of fashion and lifestyle goods. Through our platform, we aim to educate and empower our community, demonstrating that sustainable choices are not only possible but can enhance daily life in ways that feel authentic and rewarding.",
        imageUrl: "https://picsum.photos/seed/2010/1000/1000",
    },
    {
        title: "#4",
        description:
            "Join us on this journey to a sustainable lifestyle—one where every purchase is a step towards a cleaner planet, a healthier future, and a beautiful way of living. Together, we can make sustainability second nature, creating a community of conscious consumers who value quality, purpose, and responsibility.",
        imageUrl: "https://picsum.photos/seed/2024/1000/1000",
    },
];

export function AboutTiles({ className, ...props }: GenericProps) {
    return (
        <div className={cn("space-y-5 md:space-y-10", className)} {...props}>
            <div className="flex flex-col items-center gap-3 text-balance p-10 text-center">
                <h1 className="text-2xl font-bold uppercase md:text-4xl">
                    About {siteConfig.name}
                </h1>

                <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
                    {siteConfig.description}
                </p>
            </div>

            <div>
                {tiles.map((tile, i) => (
                    <div
                        key={i}
                        className={cn("flex flex-col md:flex-row", {
                            "md:flex-row-reverse": i % 2 !== 0,
                        })}
                    >
                        <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-muted p-10 text-center md:px-0">
                            <h2 className="max-w-lg text-balance text-2xl font-semibold md:text-4xl">
                                {tile.title}
                            </h2>

                            <p className="max-w-lg text-balance text-sm text-muted-foreground md:text-base">
                                {tile.description}
                            </p>
                        </div>

                        <div className="aspect-video size-full">
                            <Image
                                src={tile.imageUrl}
                                height={700}
                                width={500}
                                alt={tile.title}
                                className="size-full object-cover"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
