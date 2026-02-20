"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface MoodboardItem {
    id: string;
    imageUrl: string;
    url?: string;
    showButton?: boolean;
}

interface PageProps {
    moodboardItems: MoodboardItem[];
    title?: string;
    className?: string;
}

export function MatchaBag({
    moodboardItems,
    title = "Alternatives For Everyday Living.",
    className,
}: PageProps) {
    if (!moodboardItems.length) return null;

    return (
        <section className={cn("mb-0 w-full bg-[#FCFBF4] pb-0", className)}>
            <div className="mx-auto max-w-screen-2xl px-4">
                {/* Title */}
                <h2 className="mb-3 text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                    {title}
                </h2>

                {/* ================= DESKTOP (CAROUSEL ADDED) ================= */}
                <div className="scrollbar-hide hidden overflow-x-auto md:block">
                    <div className="flex w-max gap-6">
                        {moodboardItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.url || "/shop"}
                                className="relative flex-shrink-0"
                            >
                                <div className="relative h-[452px] w-[690px] overflow-hidden rounded-sm">
                                    <Image
                                        src={item.imageUrl}
                                        alt=""
                                        fill
                                        sizes="690px"
                                        className="object-cover"
                                    />
                                </div>

                                {item.showButton && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                                        <button className="rounded-sm bg-[#3a493f] px-6 py-2 text-sm text-white shadow">
                                            Shop Now
                                        </button>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ================= MOBILE (CAROUSEL) ================= */}
                <div className="scrollbar-hide mb-0 overflow-x-auto pb-0 md:hidden">
                    <div className="flex w-max gap-4 px-2 py-0">
                        {moodboardItems.map((item) => (
                            <Link
                                key={item.id}
                                href={item.url || "/shop"}
                                className="relative flex-shrink-0"
                            >
                                <div className="relative h-[240px] w-[360px] overflow-hidden rounded-sm">
                                    <Image
                                        src={item.imageUrl}
                                        alt=""
                                        fill
                                        sizes="360px"
                                        className="bg-[#fcfbf4] object-contain"
                                    />
                                </div>

                                {item.showButton && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                        <button className="rounded bg-[#3a493f] px-4 py-2 text-xs text-white shadow">
                                            Shop Now
                                        </button>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
