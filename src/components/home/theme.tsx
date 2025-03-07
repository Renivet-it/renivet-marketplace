"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface ThemeData {
    title: string;
    description: string;
    image: string;
}

export function Theme({ className, ...props }: GenericProps) {
    const [data, setData] = useState<ThemeData[]>([]);

    useEffect(() => {
        const fetchData = () => {
            const mockData: ThemeData[] = [
                {
                    title: "About Renivet",
                    description:
                        "We curate high-quality, sustainable products crafted with care, designed to enrich your life while respecting the planet. Rooted in the principles of circularity, our platform ensures each item lives multiple lives, reducing waste and supporting a zero-waste future.",
                    image: "https://utfs.io/a/758cbqh2wo/E02w8qhSRFZnERRlTLnhSRFZnVydgJQevlEK94BOP72qhGmw",
                },
                {
                    title: "Our Mission",
                    description:
                        "We're on a mission to make sustainability more than a trend—it's a commitment to shaping a future built on quality, longevity, and mindful choices. Inspired by our founder's journey through Europe, where sustainable living became a way of life, Renivet was born from the vision of bringing meaningful change into everyday choices.",
                    image: "https://utfs.io/a/4o4vm2cu6g/HtysHtJpctzNvuHi3KvdPZsh5fuDbkAelMyqICmp3NU7X4nH",
                },
            ];
            setData(mockData);
        };

        fetchData();
    }, []);

    return (
        <section
            className={cn("flex justify-center py-5 md:py-10", className)}
            {...props}
        >
            <div className="w-full max-w-[100rem]">
                {data.length > 0 ? (
                    data.map((item, i) => (
                        <div
                            key={i}
                            className={cn("flex flex-col md:flex-row", {
                                "md:flex-row-reverse": i % 2 !== 0,
                            })}
                        >
                            <div className="flex w-full flex-col items-center justify-center gap-4 bg-muted py-10 text-center">
                                <h2 className="text-balance text-2xl font-semibold">
                                    {item.title}
                                </h2>

                                <p className="max-w-xl text-balance text-sm text-muted-foreground">
                                    {item.description}
                                </p>

                                <Link
                                    className="text-sm font-semibold uppercase underline underline-offset-2"
                                    href="/about"
                                >
                                    Learn More
                                </Link>
                            </div>

                            <div className="h-60 w-full overflow-hidden md:h-[25rem]">
                                <Image
                                    src={item.image}
                                    height={700}
                                    width={500}
                                    alt="Pottery Design"
                                    className="size-full object-cover"
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </section>
    );
}
