"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { cn } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
}

export function ProductCard({ className, product, ...props }: PageProps) {
    const [isProductHovered, setIsProductHovered] = useState(false);
    const [isWishlistHovered, setIsWishlistHovered] = useState(false);

    return (
        <div
            className={cn("", className)}
            title={product.name}
            {...props}
            onMouseEnter={() => setIsProductHovered(true)}
            onMouseLeave={() => setIsProductHovered(false)}
        >
            <Link
                href={`/products/${product.slug}`}
                onClick={(e) => {
                    if (isWishlistHovered) e.preventDefault();
                }}
                target="_blank"
                rel="noreferrer"
            >
                <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                        src={product.imageUrls[0]}
                        alt={product.name}
                        width={1000}
                        height={1000}
                        className="size-full object-cover"
                    />

                    <div
                        className={cn(
                            "absolute bottom-0 w-full p-2 transition-all ease-in-out",
                            isProductHovered
                                ? "translate-y-0"
                                : "translate-y-full"
                        )}
                    >
                        <Button
                            size="sm"
                            className="w-full"
                            onMouseEnter={() => setIsWishlistHovered(true)}
                            onMouseLeave={() => setIsWishlistHovered(false)}
                        >
                            <Icons.Heart />
                            Wishlist
                        </Button>
                    </div>
                </div>

                <div className="space-y-1 py-2 md:p-2">
                    <div>
                        <p className="truncate text-lg font-semibold md:text-sm">
                            {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground md:text-xs">
                            {product.brand.name}
                        </p>
                    </div>

                    <p className="text-lg font-semibold md:text-sm">
                        {Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                        }).format(parseFloat(product.price))}
                    </p>
                </div>
            </Link>
        </div>
    );
}
