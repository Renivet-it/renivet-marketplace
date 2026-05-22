"use client";

import { ProductCard } from "@/components/home/new-home-page/new-arrivals";
import { cn } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";

export function MostPopularProducts({
    products,
    userId,
    className,
}: {
    products: ProductWithBrand[];
    userId?: string;
    className?: string;
}) {
    if (!products?.length) return null;

    return (
        <section className={cn("w-full bg-white py-10 md:py-14", className)}>
            <div className="max-w-screen-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col items-start">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 md:text-xs">
                        Ranked By Shopper Activity
                    </span>
                    <h2 className="mt-2 font-playfair text-[28px] font-normal uppercase leading-[1.3] text-gray-900 md:text-[36px]">
                        Most Popular Products
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm text-gray-600">
                        A live global ranking based on recent product views,
                        wishlist adds, add-to-carts, and purchases.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-5 xl:grid-cols-6">
                    {products.slice(0, 30).map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            userId={userId}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
