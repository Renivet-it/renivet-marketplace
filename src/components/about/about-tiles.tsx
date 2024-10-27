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
        title: "1910",
        description:
            "Lorem ipsum dolor sit amet consectetur adipiscing eli mattis sit phasellus mollis sit aliquam sit nullam neque ultrices.",
        imageUrl: "https://picsum.photos/seed/1910/1000/1000",
    },
    {
        title: "1990",
        description:
            "Lorem ipsum dolor sit amet consectetur adipiscing eli mattis sit phasellus mollis sit aliquam sit nullam neque ultrices.",
        imageUrl: "https://picsum.photos/seed/1990/1000/1000",
    },
    {
        title: "2010",
        description:
            "Lorem ipsum dolor sit amet consectetur adipiscing eli mattis sit phasellus mollis sit aliquam sit nullam neque ultrices.",
        imageUrl: "https://picsum.photos/seed/2010/1000/1000",
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
