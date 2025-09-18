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
        <section className={cn("w-full py-8 md:py-12 bg-[#F4F0EC]", className)} {...props}>
            <div className="text-center mb-8 md:mb-12 px-4">
                <h1 className="text-2xl md:text-4xl font-medium text-gray-900 mb-4">Curate Your Conscious Cart</h1>
            </div>
            <div className="max-w-[1424px] mx-auto px-4">
                {/* Mobile: Horizontal scroll with all items */}
                <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
                    <div className="flex space-x-4 w-max">
                        {/* Tall left card (scaled down) */}
                        <div className="w-[200px] flex-shrink-0">
                            <CategoryCard
                                banner={banners[0]}
                                className="h-[300px]"
                            />
                        </div>
                        {/* Right columns (scaled down) */}
                        <div className="flex flex-col space-y-4 w-[200px] flex-shrink-0">
                            <CategoryCard
                                banner={banners[1]}
                                className="h-[140px]"
                            />
                            <CategoryCard
                                banner={banners[2]}
                                className="h-[140px]"
                            />
                        </div>
                        <div className="flex flex-col space-y-4 w-[200px] flex-shrink-0">
                            <CategoryCard
                                banner={banners[3]}
                                className="h-[140px]"
                            />
                            <CategoryCard
                                banner={banners[4]}
                                className="h-[140px]"
                            />
                        </div>
                    </div>
                </div>

                {/* Desktop: Original masonry layout */}
                <div className="hidden md:grid grid-cols-3 gap-6">
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
        <div className={cn(
            "relative group overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-all",
            className
        )}>
            <Link href={banner?.url ?? "/shop"} className="block w-full h-full">
                <Image
                    src={banner?.imageUrl || "/fallback-image.jpg"}
                    alt={banner?.title || "Category image"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 200px, (max-width: 1024px) 300px, 500px"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
            </Link>
        </div>
    );
}