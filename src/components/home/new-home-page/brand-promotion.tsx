"use client";

import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

interface MoodboardItem {
    id: string;
    imageUrl: string;
    url?: string;
}

interface PageProps {
    moodboardItems: MoodboardItem[];
    className?: string;
}

export function BrandPromotion({ moodboardItems, className }: PageProps) {
    if (!moodboardItems?.length) return null;

    return (
        <section className={cn("w-full bg-white py-12 md:py-16", className)}>
            <div className="mx-auto max-w-screen-3xl px-4 sm:px-6 lg:px-8">
                {/* Standardized Left-Aligned Header */}
                <div className="mb-10 flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-[11px]">
                        Our Craftsmanship
                    </span>
                    <h2 className="mt-2 font-serif text-[28px] font-normal leading-[1.3] text-gray-900 md:text-[36px] uppercase">
                        Handmade Stories from Across India
                    </h2>
                </div>

                {/* Interactive Story Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {moodboardItems.slice(0, 4).map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                delay: index * 0.1,
                                duration: 0.8,
                                ease: [0.21, 0.45, 0.32, 0.9],
                            }}
                        >
                            <Link
                                href={item.url || "/shop"}
                                className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-[#fbfaf4] shadow-md transition-all duration-500 hover:shadow-2xl md:aspect-[4/5]"
                            >
                                <Image
                                    src={item.imageUrl}
                                    alt="Brand Story"
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                />

                                {/* Subtle Inner Shadow Overlay */}
                                <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                                {/* Bottom Action Indicator */}
                                <div className="absolute bottom-6 left-6 right-6 flex translate-y-4 items-center justify-between opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                                    <div className="mr-4 h-[1px] flex-1 bg-white/40" />
                                    <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-white">
                                        Explore Story
                                    </span>
                                    <Icons.ArrowRight
                                        size={14}
                                        className="ml-2 text-white"
                                    />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
