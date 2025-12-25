"use client";

import { cn } from "@/lib/utils";
import { Banner } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
    banners: Banner[];
}

export function HomeAndLivingectionAdvertisement({ className, banners, ...props }: PageProps) {
    return (
        <section className={cn("w-full py-8 md:py-12 bg-[#FCFBF4]", className)} {...props}>
            <div className="text-center mb-8 md:mb-12 px-4">
                <h1 className="text-2xl md:text-4xl font-medium text-gray-900 mb-2">Home & Living</h1>
                <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
                    Bring Sustainability Into Your Home With Thoughtfully Crafted Pieces That Blend Style, Function, And Purpose.
                </p>
            </div>
            <div className="max-w-[1424px] mx-auto px-4">
                {/* Mobile: Horizontal scroll */}
                <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
                    <div className="flex space-x-4 w-max">
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
                                <div key={index} className="w-[120px] flex-shrink-0">
                                    <CategoryCard
                                        banner={banners[index]}
                                        className="h-[140px]"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col space-y-4">
                            {[3, 4, 5].map((index) => (
                                <div key={index} className="w-[120px] flex-shrink-0">
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
                <div className="hidden md:grid grid-cols-3 gap-6">
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
    className
}: {
    banner: Banner;
    className?: string;
}) {
    return (
        <div className={cn(
            "relative group overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100",
            className
        )}>
            <Link href={banner?.url || "/shop"} className="block w-full h-full">
                <Image
                    src={banner?.imageUrl || "/fallback-image.jpg"}
                    alt={banner?.title || "Category image"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 120px, (max-width: 1024px) 200px, 400px"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                {banner?.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                        <h3 className="text-white font-medium text-lg">{banner.title}</h3>
                    </div>
                )}
            </Link>
        </div>
    );
}