"use client";

import { cn } from "@/lib/utils";
import { HomeBrandProduct } from "@/lib/validations";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface PageProps extends GenericProps {
    brandProducts: HomeBrandProduct[];
}

export function BrandProducts({
    className,
    brandProducts,
    ...props
}: PageProps) {
    return (
        <section
            className={cn(
                "flex w-full justify-center py-5 md:py-10",
                className
            )}
            {...props}
        >
            <div className="container">
                <div className="flex justify-center gap-2">
                    <h2
                        className={cn(
                            "text-xl sm:text-3xl",
                            "text-center",
                            "capitalize",
                            "pb-4"
                        )}
                    >
                        top-rated brand products
                    </h2>
                    <img
                        src="assets/marketing/downward-rotation-svgrepo-com.svg"
                        alt="arrow-down"
                        className="h-10 w-10"
                    />
                </div>
                <div className="scrollbar-hide flex flex-col gap-4 overflow-x-auto px-1 md:hidden">
                    <div className="flex gap-4">
                        {brandProducts.map((item, index) => (
                            <BrandCard key={index} product={item} />
                        ))}
                    </div>
                </div>

                <div className="hidden grid-cols-2 gap-6 md:grid lg:grid-cols-3 xl:grid-cols-4">
                    {brandProducts.map((item, index) => (
                        <BrandCard key={index} product={item} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function BrandCard({ product }: { product: HomeBrandProduct }) {
    // const discount =
    //     product.comparePrice && product.price
    //         ? Math.round(
    //               ((product.comparePrice - product.price) /
    //                   product.comparePrice) *
    //                   100
    //           )
    //         : 0;

    return (
        <Link
            href={product.url || "/shop"}
            className="relative w-[200px] flex-shrink-0 md:w-auto"
        >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[8px] shadow-sm">
                <Image
                    src={product.imageUrl}
                    alt={"product.title"}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(rgba(0,0,0,0.004),rgb(0,0,0))] p-3 text-white rounded-[8px]">
                    <h3 className="truncate text-[14px] font-semibold">
                        {"product.title"}
                    </h3>
                    <p className="truncate text-[12px] capitalize opacity-80">
                        {"product.category"}
                    </p>

                    <div className="mt-1 flex items-center justify-between text-sm">
                        <div className="space-x-2">
                            <span className="text-[12px] font-bold">
                                ₹{"product.price"}
                            </span>

                            {product.comparePrice && (
                                <>
                                    <span className="text-[10px] line-through opacity-70">
                                        ₹{product.comparePrice}
                                    </span>
                                    <span className="text-[10px] font-semibold text-green-400">
                                        {/* Replace this with calculated value */}
                                        {Math.round(
                                            ((product.comparePrice -
                                                product.price) /
                                                product.comparePrice) *
                                                100
                                        )}
                                        % off
                                    </span>
                                </>
                            )}

                            <span className="text-[10px] line-through opacity-70">
                                ₹{"product.comparePrice"}
                            </span>
                            <p className="text-[10px] font-semibold text-green-400">
                                {/* Replace this with calculated value */}
                                {"product.discount"}% off
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
