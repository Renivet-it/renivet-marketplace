"use client";

import { Advertisement } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
    advertisements: Advertisement[];
}

export function AdvertisementPage({ advertisements }: PageProps) {
    if (!advertisements.length) return null;

    return (
        <div className="relative w-full">
            {advertisements.map((ad) => (
                <div
                    key={ad.id}
                    className="relative size-full"
                    style={{ height: `${ad.height}vh` }}
                >
                    {ad.url ? (
                        <Link href={ad.url} target="_blank">
                            <Image
                                src={ad.imageUrl}
                                alt={ad.title}
                                fill
                                className="object-cover"
                                sizes="100vw"
                                priority
                            />
                        </Link>
                    ) : (
                        <Image
                            src={ad.imageUrl}
                            alt={ad.title}
                            fill
                            className="object-cover"
                            sizes="100vw"
                            priority
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
