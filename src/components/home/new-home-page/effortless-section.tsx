"use client";

import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
// Embla imports
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface MoodboardItem {
    id: string;
    imageUrl: string;
    title?: string;
    subtitle?: string;
    url?: string;
}

interface PageProps {
    moodboardItems: MoodboardItem[];
    className?: string;
}

export function EffortlessElegance({ moodboardItems, className }: PageProps) {
    const autoplay = Autoplay({ delay: 4000, stopOnInteraction: false });

    // ==========================
    // MOBILE EMBLA CONFIG
    // ==========================
    const [emblaRef, embla] = useEmblaCarousel({ loop: true }, [autoplay]);
    const [activeIndex, setActiveIndex] = useState(0);

    const onSelect = useCallback(() => {
        if (!embla) return;
        setActiveIndex(embla.selectedScrollSnap());
    }, [embla]);

    useEffect(() => {
        if (!embla) return;
        embla.on("select", onSelect);
        onSelect();
    }, [embla, onSelect]);

    if (!moodboardItems.length) return null;

    return (
        <section className={cn("w-full bg-[#FCFBF4]", className)}>
            <div className="max-w-screen-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* ===================== DESKTOP (unchanged) ===================== */}
                <div
                    className="relative hidden w-full overflow-hidden md:block"
                    style={{ aspectRatio: "1363/400" }}
                >
                    {moodboardItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={cn(
                                "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                                index === activeIndex
                                    ? "z-10 opacity-100"
                                    : "z-0 opacity-0"
                            )}
                        >
                            <Link
                                href={item.url ?? "/shop"}
                                className="relative block h-full w-full"
                            >
                                <Image
                                    src={item.imageUrl}
                                    alt={item.title || "Banner"}
                                    fill
                                    sizes="(max-width: 1536px) 100vw, 1536px"
                                    className="object-cover"
                                />
                            </Link>

                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                                <h2 className="mb-2 text-3xl font-light">
                                    {item.title}
                                </h2>
                                {item.subtitle && (
                                    <p className="mb-6 text-xl">
                                        {item.subtitle}
                                    </p>
                                )}
                                <Link
                                    href={item.url ?? "/shop"}
                                    className="bg-white px-6 py-2 text-sm text-gray-800 shadow transition hover:bg-gray-100"
                                >
                                    Shop The Edit
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ===================== MOBILE CAROUSEL (NEW) ===================== */}
                <div className="relative w-full overflow-hidden md:hidden">
                    {/* Embla viewport */}
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {moodboardItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="relative h-[365px] w-full flex-shrink-0"
                                >
                                    <Link
                                        href={item.url ?? "/shop"}
                                        className="relative block h-full w-full"
                                    >
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title || "Banner"}
                                            fill
                                            sizes="(max-width: 768px) 100vw, 384px"
                                            className="object-cover"
                                        />

                                        {/* TEXT OVERLAY */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
                                            <h2 className="mb-1 text-base font-light">
                                                {item.title}
                                            </h2>

                                            {item.subtitle && (
                                                <p className="mb-4 text-sm font-light">
                                                    {item.subtitle}
                                                </p>
                                            )}

                                            <span className="rounded bg-white px-4 py-1 text-xs text-gray-800 shadow">
                                                Shop The Edit
                                            </span>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DOTS */}
                    <div className="absolute bottom-3 flex w-full justify-center gap-2">
                        {moodboardItems.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => embla?.scrollTo(idx)}
                                className={cn(
                                    "h-2 w-2 rounded-full transition",
                                    idx === activeIndex
                                        ? "bg-white"
                                        : "bg-white/50"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
