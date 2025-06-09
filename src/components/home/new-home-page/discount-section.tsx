"use client";

import { Advertisement } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
    advertisements: Advertisement[];
}

export function AdvertisementDiscountPage({ advertisements }: PageProps) {
    if (!advertisements.length) return null;

    return (
        <div className="relative w-full px-4 py-6 md:px-8 md:py-8">
            {advertisements.map((ad) => (
                <div
                    key={ad.id}
                    className="relative w-full max-w-5xl md:max-w-6xl lg:max-w-7xl mx-auto overflow-hidden rounded-[40px] border-2 border-gray-200 shadow-lg"
                >
                    {ad.url ? (
                        <Link href={ad.url} target="_blank">
                            <div className="relative w-full">
                                <Image
                                    src={ad.imageUrl}
                                    alt={ad.title}
                                    width={1200}
                                    height={800}
                                    className="h-auto w-full object-contain"
                                    priority
                                    quality={100}
                                />
                            </div>
                        </Link>
                    ) : (
                        <div className="relative w-full">
                            <Image
                                src={ad.imageUrl}
                                alt={ad.title}
                                width={1200}
                                height={800}
                                className="h-auto w-full object-contain"
                                priority
                                quality={100}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}