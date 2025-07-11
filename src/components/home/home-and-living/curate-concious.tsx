"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
    banners: Banner[];
}

export function CurateConcious({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("w-full py-12 bg-[#F4F0EC]", className)} {...props}>
            <div className="max-w-[1424px] mx-auto px-4">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-medium text-gray-900 mb-4">Curate Your Conscious Cart</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Bibendum quis facilisi aliquet massa in pharetra nisi etiam ornare. Tellus feugiat egestas nulla sem vel mi dictum nisi
                    </p>
                </div>

                {/* Masonry Grid Layout */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column - Tall (352x934) */}
                    <div className="row-span-2">
                        <CategoryCard
                            banner={banners[0]}
                            className="h-[934px]"
                            imageSize="352px"
                            title="kitchen & essentials"
                            count={28}
                        />
                    </div>

                    {/* Middle Column - Two equal height items */}
                    <div className="space-y-6">
                        <CategoryCard
                            banner={banners[1]}
                            className="h-[454px]"
                            imageSize="568px"
                            title="candles"
                            count={42}
                        />
                        <CategoryCard
                            banner={banners[2]}
                            className="h-[454px]"
                            imageSize="568px"
                            title="carvains"
                            count={16}
                        />
                    </div>

                    {/* Right Column - Two equal height items */}
                    <div className="space-y-6">
                        <CategoryCard
                            banner={banners[3]}
                            className="h-[454px]"
                            imageSize="568px"
                            title="Decor"
                            count={84}
                        />
                        <CategoryCard
                            banner={banners[4]}
                            className="h-[454px]"
                            imageSize="568px"
                            title="other"
                            count={40}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function CategoryCard({
    banner,
    className,
    imageSize,
    title,
    count
}: {
    banner: Banner;
    className?: string;
    imageSize: string;
    title: string;
    count: number;
}) {
    return (
        <div className={cn("relative group overflow-hidden bg-white", className)}>
            <Link href="/shop" className="block w-full h-full">
                <Image
                    src={banner.imageUrl}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes={`(max-width: 768px) 100vw, ${imageSize}`}
                />
                <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold capitalize">{title.toLowerCase()}</h3>
                    <p className="text-sm">{count} products</p>
                </div>
            </Link>
        </div>
    );
}