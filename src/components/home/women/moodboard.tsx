"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface MoodboardItem {
    id: string;
    imageUrl: string;
    title?: string;
    url?: string;
}

interface PageProps {
    moodboardItems: MoodboardItem[];
    title?: string;
    className?: string;
}

export function MoodboardItem({
    moodboardItems,
    title = "Moodboard for Her",
    className,
}: PageProps) {
    if (!moodboardItems.length) return null;

    return (
        <section className={cn("w-full bg-[#FCFBF4] pb-6 md:pb-10", className)}>
            <div className="mx-auto max-w-screen-2xl">
                {/* Title & Subtitle */}
                <div className="mb-4 px-4 pt-6 text-center sm:px-6 md:mb-10 md:pt-8 lg:px-8">
                    <h2 className="text-center font-playfair text-[18px] font-[400] leading-[1.3] tracking-[0.5px] text-[#7A6338] md:text-[26px]">
                        Curated Her Essence
                    </h2>
                </div>

                {/* Responsive image container */}
                {moodboardItems.slice(0, 1).map((item) => (
                    <div
                        key={item.id}
                        className="relative aspect-[1440/1289] h-auto w-full"
                    >
                        <Link
                            href={item.url || "/shop"}
                            className="block h-full w-full"
                        >
                            <Image
                                src={item.imageUrl}
                                alt={item.title || "Moodboard item"}
                                fill
                                className="h-full w-full object-cover"
                                priority
                                quality={100}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1440px"
                            />
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}
