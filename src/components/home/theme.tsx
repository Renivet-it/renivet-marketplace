"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
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
                    title: "Made in Viet Nam Since 1450",
                    description:
                        "Lorem ipsum dolor sit amet consectetur amet consectetur adipiscing eli mattis sit phasellus mollis sit aliquam sit nullat phasellus mollis sit aliquam sit nullam neque ultrices.",
                    image: "/images/theme1.png",
                },
                {
                    title: "Our History - Next Vision",
                    description:
                        "Lorem ipsum adipiscing eli mattis sit phasellus mollis sit aliquam sit nullat phasellus mollis sit aliquam sit nullam neque ultrices dolor sit amet consectetur adipiscing eli mattis sit .",
                    image: "/images/theme2.png",
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

                                <button className="text-sm font-semibold uppercase underline underline-offset-2">
                                    Learn More
                                </button>
                            </div>

                            <div className="size-full">
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
