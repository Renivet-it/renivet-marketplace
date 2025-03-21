"use client";

import { Advertisement } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
    advertisements: Advertisement[];
}

export function AdvertisementPage({ advertisements }: PageProps) {
    if (!advertisements.length) return null;

    const desktopAd = advertisements[2];
    const mobileAd = advertisements[3];

    if (!desktopAd || !mobileAd) return null;

    return (
        <div className="relative w-full">
            <div
                className="relative size-full"
                style={{ height: `${desktopAd.height}vh` }}
            >
                {desktopAd.url ? (
                    <Link href={desktopAd.url} target="_blank">
                        <Image
                            src={desktopAd.imageUrl}
                            alt={desktopAd.title}
                            fill
                            className="hidden object-contain md:block"
                            sizes="100vw"
                            priority
                        />
                        <Image
                            src={mobileAd.imageUrl}
                            alt={mobileAd.title}
                            fill
                            className="object-cover md:hidden"
                            sizes="100vw"
                            priority
                        />
                    </Link>
                ) : (
                    <>
                        <Image
                            src={desktopAd.imageUrl}
                            alt={desktopAd.title}
                            fill
                            className="hidden object-contain md:block"
                            sizes="100vw"
                            priority
                        />
                        <Image
                            src={mobileAd.imageUrl}
                            alt={mobileAd.title}
                            fill
                            className="object-cover md:hidden"
                            sizes="100vw"
                            priority
                        />
                    </>
                )}
            </div>
        </div>
    );
}
