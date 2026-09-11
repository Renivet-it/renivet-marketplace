"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
    banners: Banner[];
}

export function HomeAndLivingectionAdvertisement({
    className,
    banners,
    ...props
}: PageProps) {
    return (
        <section
            className={cn("w-full bg-white py-8 md:py-12", className)}
            {...props}
        >
            <div className="mb-8 px-4 text-center md:mb-12">
                <h2 className="mb-2 text-2xl font-medium text-gray-900 md:text-4xl">
                    Home & Living
                </h2>
                <p className="mx-auto max-w-2xl text-sm text-gray-600 md:text-base">
                    Bring Sustainability Into Your Home With Thoughtfully
                    Crafted Pieces That Blend Style, Function, And Purpose.
                </p>
            </div>
            <div className="mx-auto max-w-[1424px] px-4">
                {/* Mobile: Horizontal scroll */}
                <div className="-mx-4 overflow-x-auto px-4 pb-4 md:hidden">
                    <div className="flex w-max space-x-4">
                        {/* Large box (scaled down) */}
                        <div className="w-[200px] flex-shrink-0">
                            <CategoryCard
                                banner={banners[0]}
                                className="h-[300px]"
                            />
                        </div>
                        {/* Smaller boxes (2 columns) */}
                        <div className="flex flex-col space-y-4">
                            {[1, 2].map((index) => (
                                <div
                                    key={index}
                                    className="w-[120px] flex-shrink-0"
                                >
                                    <CategoryCard
                                        banner={banners[index]}
                                        className="h-[140px]"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col space-y-4">
                            {[3, 4, 5].map((index) => (
                                <div
                                    key={index}
                                    className="w-[120px] flex-shrink-0"
                                >
                                    <CategoryCard
                                        banner={banners[index]}
                                        className="h-[140px]"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Desktop: Grid layout with 1 large + 5 small boxes */}
                <div className="hidden grid-cols-3 gap-6 md:grid">
                    {/* Large box - spans 2 rows */}
                    <div className="row-span-2">
                        <CategoryCard
                            banner={banners[0]}
                            className="h-[934px]"
                        />
                    </div>

                    {/* First column with 2 boxes */}
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

                    {/* Second column with 3 boxes */}
                    <div className="space-y-6">
                        <CategoryCard
                            banner={banners[3]}
                            className="h-[290px]"
                        />
                        <CategoryCard
                            banner={banners[4]}
                            className="h-[290px]"
                        />
                        <CategoryCard
                            banner={banners[5]}
                            className="h-[290px]"
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
}: {
    banner: Banner;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md",
                className
            )}
        >
            <Link href={banner?.url || "/shop"} className="block h-full w-full">
                <Image
                    src={banner?.imageUrl || "/fallback-image.jpg"}
                    alt={banner?.title || "Category image"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 120px, (max-width: 1024px) 200px, 400px"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 transition-all duration-300 group-hover:bg-opacity-10" />
                {banner?.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <h3 className="text-lg font-medium text-white">
                            {banner.title}
                        </h3>
                    </div>
                )}
            </Link>
        </div>
    );
}
