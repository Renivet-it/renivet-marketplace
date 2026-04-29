"use client";

import { Banner } from "@/lib/validations";
import React from "react";
import { ProductCard } from "./new-arrivals";
import { cn } from "@/lib/utils";

export function MayAlsoLoveThese({
    banners,
    userId,
    className,
}: {
    banners: Banner[];
    userId?: string;
    className?: string;
}) {
    if (!banners || !banners.length) return null;

    const items = banners.slice(0, 18);

    return (
        <section className={cn("w-full bg-white py-10 md:py-14", className)}>
            <div className="mx-auto max-w-screen-3xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-[11px]">
                        Our Recommendations
                    </span>
                    <h2 className="mt-2 font-playfair text-[28px] font-normal leading-[1.3] text-gray-900 md:text-[36px] uppercase">
                        You Might Also Like
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 xl:grid-cols-6">
                    {items.map((item) => {
                        if (!item.product) return null;
                        return (
                            <ProductCard
                                key={item.id}
                                product={item.product as any}
                                userId={userId}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
