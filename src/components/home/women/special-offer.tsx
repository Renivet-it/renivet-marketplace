"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
    banners: Banner[];
    className?: string;
}

export function SpecialOffer({ className, banners }: PageProps) {
    return (
        <section
            className={cn("w-full py-2 md:py-12", className)}
            style={{ backgroundColor: "#FCFBF4" }}
        >
            <h2 className="mb-4 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                Thoughtfully Chosen Essentials
            </h2>
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {banners.map((item: any) => (
                        <div
                            key={item.id}
                            className="relative aspect-[584/450] w-full overflow-hidden rounded-2xl shadow-lg transition-shadow duration-300 hover:shadow-xl"
                        >
                            <Link
                                href={item.url || "#"}
                                className="block h-full w-full"
                            >
                                {/* Image with new dimensions */}
                                <div className="relative h-full w-full">
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.title}
                                        width={584}
                                        height={467}
                                        className="h-full w-full object-cover"
                                        priority
                                    />
                                </div>

                                {/* Text Overlay */}
                                <div className="absolute inset-0 flex flex-col justify-between p-6 text-white sm:p-8">
                                    <div>
                                        <h3 className="mb-2 text-2xl font-bold sm:text-3xl">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm italic sm:text-base">
                                            {item.description?.[0]}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="mb-2 text-lg font-semibold sm:text-xl">
                                            {item.description?.[1]}
                                        </p>
                                        <button className="rounded-full bg-white px-6 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 sm:text-base">
                                            BUY NOW
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
