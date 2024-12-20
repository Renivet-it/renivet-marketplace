"use client";

import { cn, formatPriceTag } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { WishlistButton } from "../buttons";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
    isWishlisted: boolean;
    userId?: string;
}

export function ProductCard({
    className,
    product,
    isWishlisted,
    userId,
    ...props
}: PageProps) {
    const [isProductWishlisted, setIsProductWishlisted] =
        useState(isWishlisted);

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
                            "absolute bottom-0 hidden w-full p-2 transition-all ease-in-out md:inline-block",
                            isProductHovered
                                ? "translate-y-0"
                                : "translate-y-full"
                        )}
                    >
                        <WishlistButton
                            className={cn(
                                "w-full hover:bg-background hover:text-foreground",
                                isProductWishlisted &&
                                    "bg-background text-primary hover:bg-muted",
                                !userId && "hidden"
                            )}
                            userId={userId}
                            productId={product.id}
                            isProductWishlisted={isProductWishlisted}
                            setIsProductWishlisted={setIsProductWishlisted}
                            onMouseEnter={() => setIsWishlistHovered(true)}
                            onMouseLeave={() => setIsWishlistHovered(false)}
                        />
                    </div>
                </div>
            </Link>

            <div className="space-y-1 py-2 md:p-2">
                <div>
                    <div className="flex items-center gap-1">
                        <p className="truncate text-sm font-semibold">
                            {product.name}
                        </p>

                        <div className="md:hidden">
                            <WishlistButton
                                size="icon"
                                className={cn(
                                    "size-8 bg-background hover:bg-background",
                                    isProductWishlisted && "text-primary",
                                    !userId && "hidden"
                                )}
                                iconClassName={cn("stroke-primary")}
                                hideText
                                userId={userId}
                                productId={product.id}
                                isProductWishlisted={isProductWishlisted}
                                setIsProductWishlisted={setIsProductWishlisted}
                                onMouseEnter={() => setIsWishlistHovered(true)}
                                onMouseLeave={() => setIsWishlistHovered(false)}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {product.brand.name}
                    </p>
                </div>

                <p className="text-sm font-semibold">
                    {formatPriceTag(parseFloat(product.price), true)}
                </p>
            </div>
        </div>
    );
}
