"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

const works: {
    title: string;
    description: string;
}[] = [
    {
        title: "Product Design",
        description:
            "Lorem ipsum dolor sit amet consectetur adipiscing eli mattis sit phasellus mollis.",
    },
    {
        title: "Crafted",
        description:
            "Rutrum vitae risus eget, vulputate aliquam nisi ex gravida neque tempus.",
    },
    {
        title: "Sell Product",
        description:
            "Maecenas sem eros, rutrum vitae risus eget, vulputate aliquam nisi.",
    },
];

export function HowWeWork({ className, ...props }: GenericProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-between md:flex-row",
                className
            )}
            {...props}
        >
            <div className="aspect-[4/3] size-full basis-1/2">
                <Image
                    src="https://picsum.photos/seed/5461/1000/1000"
                    alt="How We Work"
                    width={1000}
                    height={1000}
                    className="size-full object-cover"
                />
            </div>

            <div className="flex w-full basis-1/2 justify-center">
                <div className="space-y-5 px-5 pt-5 md:space-y-10 md:p-10">
                    <h2 className="text-balance text-xl font-semibold uppercase md:text-3xl">
                        How We Work
                    </h2>

                    <div className="space-y-5">
                        {works.map((work, i) => (
                            <div key={i} className="space-y-2">
                                <p className="text-balance font-semibold md:text-xl">
                                    {work.title}
                                </p>

                                <p className="max-w-lg text-sm text-muted-foreground md:text-base">
                                    {work.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
