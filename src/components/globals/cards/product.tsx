"use client";

import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    /**
     * Helper function
     */
    function isEmptyArray(arr: Array<any>): boolean {
        return arr.length === 0;
    }
    // Get valid media URLs from product and remove duplicates
    const mediaUrls =
        Array.from(
            new Set(
                product.media
                    ?.filter((media) => media.mediaItem?.url)
                    .map((media) => media.mediaItem?.url || "")
            )
        ) || [];

    // Reset image index when not hovering
    useEffect(() => {
        if (!isProductHovered) {
            setCurrentImageIndex(0);
        }
    }, [isProductHovered]);

    // Set up slideshow interval when hovering
    useEffect(() => {
        let slideshowInterval: number | undefined = undefined;

        if (isProductHovered && mediaUrls.length > 1) {
            slideshowInterval = window.setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    prevIndex === mediaUrls.length - 1 ? 0 : prevIndex + 1
                );
            }, 1500); // Change image every 1.5 seconds
        }

        return () => {
            if (slideshowInterval !== undefined) {
                window.clearInterval(slideshowInterval);
            }
        };
    }, [isProductHovered, mediaUrls.length]);

    let productPrice = 0;
    let productCompareAtPrice = 0;

    if (!product.productHasVariants) {
        productPrice = product.price || 0;
        productCompareAtPrice = product.compareAtPrice || 0;
    } else {
        // Find the variant with the minimum price
        const minPriceVariant = product.variants.reduce(
            (min, variant) => (variant.price < min.price ? variant : min),
            product.variants[0]
        );

        productPrice = minPriceVariant?.price || 0;
        productCompareAtPrice = minPriceVariant?.compareAtPrice || 0;
    }

    return (
        <div
            className={cn("", className)}
            title={product.title}
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
                    {/* Product default image */}
                    {isEmptyArray(mediaUrls) && (
                        <Image
                            src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                            alt="default image"
                            width={1000}
                            height={1000}
                            className={cn(
                                "size-full object-cover transition-all duration-500 ease-in-out",
                                isProductHovered ? "scale-105" : "scale-100"
                            )}
                        />
                    )}
                    {mediaUrls.length > 0 && (
                        <Image
                            src={mediaUrls[currentImageIndex]}
                            alt={product.title}
                            width={1000}
                            height={1000}
                            className={cn(
                                "size-full object-cover transition-all duration-500 ease-in-out",
                                isProductHovered ? "scale-105" : "scale-100"
                            )}
                        />
                    )}

                    {/* Image indicators for slideshow */}
                    {mediaUrls.length > 1 && (
                        <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center gap-1.5">
                            {mediaUrls.map((_, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300",
                                        currentImageIndex === index
                                            ? "w-3 bg-primary"
                                            : "w-1.5 bg-background/70"
                                    )}
                                />
                            ))}
                        </div>
                    )}

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
                                "w-full bg-background hover:bg-background hover:text-foreground",
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
                            {product.title}
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

                {/* <p className="text-sm font-semibold">
                    {formatPriceTag(
                        parseFloat(convertPaiseToRupees(productPrice)),
                        true
                    )}
                       -  {parseFloat(convertPaiseToRupees(product.compareAtPrice))}

                </p> */}

                <p className="text-sm font-semibold">
                    <span className="text-gray-900">
                        Rs.
                        {formatPriceTag(
                            parseFloat(convertPaiseToRupees(productPrice))
                        )}
                    </span>
                    {productCompareAtPrice &&
                    productCompareAtPrice > productPrice ? (
                        <>
                            {" "}
                            <span className="text-gray-400 line-through">
                                Rs.
                                {formatPriceTag(
                                    parseFloat(
                                        convertPaiseToRupees(
                                            productCompareAtPrice
                                        )
                                    )
                                )}
                            </span>{" "}
                            <span className="text-red-600">
                                (
                                {Math.round(
                                    ((parseFloat(
                                        convertPaiseToRupees(
                                            productCompareAtPrice
                                        )
                                    ) -
                                        parseFloat(
                                            convertPaiseToRupees(productPrice)
                                        )) /
                                        (parseFloat(
                                            convertPaiseToRupees(
                                                productCompareAtPrice
                                            )
                                        ) || 1)) *
                                        100
                                )}
                                % OFF)
                            </span>
                        </>
                    ) : null}
                </p>
            </div>
        </div>
    );
}
