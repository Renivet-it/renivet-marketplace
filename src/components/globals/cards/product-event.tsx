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

export function EventProductCard({
    className,
    product,
    isWishlisted,
    userId,
    ...props
}: PageProps) {
    const [isProductWishlisted, setIsProductWishlisted] = useState(isWishlisted);
    const [isProductHovered, setIsProductHovered] = useState(false);
    const [isWishlistHovered, setIsWishlistHovered] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
            }, 1500);
        }

        return () => {
            if (slideshowInterval !== undefined) {
                window.clearInterval(slideshowInterval);
            }
        };
    }, [isProductHovered, mediaUrls.length]);

    let productPrice = 0;

    if (!product.productHasVariants) productPrice = product.price || 0;
    else productPrice = Math.min(...product.variants.map((x) => x.price));

    return (
        <div
            className={cn("group cursor-pointer mx-auto", className)}
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
                className="block"
            >
                <div className="relative overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl bg-white rounded-t-[120px]">
                    
                    {/* Half-Circle Top Section */}
                    <div 
                        className="relative bg-gradient-to-br from-purple-200 via-pink-100 to-purple-300 px-6 pt-8 pb-4"
                        style={{
                            borderRadius: "50% 50% 0 0",
                            aspectRatio: '1/0.8'
                        }}
                    >
                        {/* Wishlist Button */}
                        {userId && (
                            <div className="absolute right-4 top-4 z-20">
                                <WishlistButton
                                    size="icon"
                                    className={cn(
                                        "size-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white",
                                        isProductWishlisted && "text-red-500"
                                    )}
                                    iconClassName="stroke-2"
                                    hideText
                                    userId={userId}
                                    productId={product.id}
                                    isProductWishlisted={isProductWishlisted}
                                    setIsProductWishlisted={setIsProductWishlisted}
                                    onMouseEnter={() => setIsWishlistHovered(true)}
                                    onMouseLeave={() => setIsWishlistHovered(false)}
                                />
                            </div>
                        )}

                        {/* Circular Image Container */}
                        <div className="relative mx-auto aspect-[3/4] w-full max-w-[168px]">
                            {/* White circular background */}
                            <div className="absolute inset-0 rounded-full bg-white/90 backdrop-blur-sm"></div>
                            
                            {/* Image container */}
                            <div className="relative h-full w-full overflow-hidden rounded-full p-3">
                                {/* Product default image */}
                                {isEmptyArray(mediaUrls) && (
                                    <Image
                                        src='https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1'
                                        alt='default image'
                                        width={300}
                                        height={300}
                                        className={cn(
                                            "h-full w-full object-cover transition-all duration-500 ease-in-out",
                                            isProductHovered ? "scale-110" : "scale-100"
                                        )}
                                    />
                                )}
                                {mediaUrls.length > 0 && (
                                    <Image
                                        src={mediaUrls[currentImageIndex]}
                                        alt={product.title}
                                        width={300}
                                        height={300}
                                        className={cn(
                                            "h-full w-full object-cover transition-all duration-500 ease-in-out",
                                            isProductHovered ? "scale-110" : "scale-100"
                                        )}
                                    />
                                )}
                            </div>

                            {/* Image indicators */}
                            {mediaUrls.length > 1 && (
                                <div className="absolute -bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-1">
                                    {mediaUrls.map((_, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "h-1.5 rounded-full transition-all duration-300",
                                                currentImageIndex === index
                                                    ? "w-4 bg-purple-600"
                                                    : "w-1.5 bg-white/60"
                                            )}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Square Bottom Section */}
                    <div className="bg-purple-400 px-4 sm:px-6 py-3 sm:py-4">
                        <div className="mb-1 truncate text-xxs text-white text-center">
                            {product.title}
                        </div>
                        
                        <div className="flex items-center justify-center">
                            <span className="text-base text-xxs font-bold text-white">
                                {formatPriceTag(parseFloat(convertPaiseToRupees(productPrice)))}
                            </span>
                        </div>
                        
                        {product.compareAtPrice && (
                            <div className="flex items-center justify-center gap-1 sm:gap-2 mt-1">
                                <span className="text-xxs sm:text-sm text-white/80 line-through">
                                    {formatPriceTag(parseFloat(convertPaiseToRupees(product.compareAtPrice)))}
                                </span>
                                <span className="rounded-full text-xxs bg-red-500 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium text-white">
                                    {Math.round(
                                        ((parseFloat(convertPaiseToRupees(product.compareAtPrice)) -
                                         parseFloat(convertPaiseToRupees(productPrice))) /
                                        (parseFloat(convertPaiseToRupees(product.compareAtPrice)) || 1)) * 100
                                    )}% OFF
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    );
}