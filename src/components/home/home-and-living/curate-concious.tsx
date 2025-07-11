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
                            <div className="text-center mb-12">
                    <h1 className="text-4xl font-medium text-gray-900 mb-4">Curate Your Conscious Cart</h1>
                </div>
            <div className="max-w-[1424px] mx-auto px-4">
                {/* Masonry Grid Layout */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Left Column - Tall */}
                    <div className="row-span-2">
                        <CategoryCard
                            banner={banners[0]}
                            className="h-[934px]"
                        />
                    </div>

                    {/* Middle Column */}
                    <div className="space-y-6">
                        <CategoryCard
                            banner={banners[1]}
                            className="h-[454px]"
                        />
                        <CategoryCard
                            banner={banners[2]}
                            className="h-[454px]"
                        />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <CategoryCard
                            banner={banners[3]}
                            className="h-[454px]"
                        />
                        <CategoryCard
                            banner={banners[4]}
                            className="h-[454px]"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function CategoryCard({
    banner,
    className
}: {
    banner: Banner;
    className?: string;
}) {
    return (
        <div className={cn("relative group overflow-hidden bg-white", className)}>
            <Link href="/shop" className="block w-full h-full">
                <Image
                    src={banner.imageUrl}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 568px"
                />
            </Link>
        </div>
    );
}