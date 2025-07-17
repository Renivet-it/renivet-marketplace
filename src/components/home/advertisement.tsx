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
        <div className="bg-[#F4F0EC] relative w-full">
            {advertisements.map((ad) => (
                <div
                    key={ad.id}
                    className="relative h-full w-full"
                >
                    {ad.url ? (
                        <Link href={ad.url} target="_blank">
                            <Image
                                src={ad.imageUrl}
                                alt={ad.title}
                                width={1920}
                                height={1080}
                                className="object-cover"
                            />
                        </Link>
                    ) : (
                        <Image
                            src={ad.imageUrl}
                            alt={ad.title}
                            width={1920}
                            height={1080}
                            className="object-cover"
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
