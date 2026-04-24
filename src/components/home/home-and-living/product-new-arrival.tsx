"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AnimatedProductLink } from "@/components/home/new-home-page/animated-product-link";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { Heart } from "lucide-react";

interface Product {
    slug: any;
    id: string;
    media: { mediaItem: { url: string } }[];
    title: string;
    variants?: {
        price: number;
        compareAtPrice?: number;
    }[];
    price?: number;
    compareAtPrice?: number;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
    products: { product: Product }[];
    title?: string;
}

export function ProductGridNewArrivals({
    className,
    products,
    title = "New Arrival",
    ...props
}: ProductGridProps) {
    if (!products || !Array.isArray(products) || products.length === 0) {
        return null;
    }

    return (
        <section
            className={cn("w-full bg-white px-4 py-12", className)}
            {...props}
        >
            <div className="mx-auto max-w-[1360px]">
                {/* Centered Header */}
                <div className="mb-12 text-left md:text-left">
                    <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-2">
                        EXCLUSIVE
                    </p>
                    <h2 className="text-3xl md:text-4xl tracking-widest font-serif text-gray-900 uppercase">
                        {title}
                    </h2>
                </div>

                {/* Mobile Carousel (hidden on desktop) */}
                <div className="md:hidden">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 5000,
                            }),
                        ]}
                        className="w-full"
                    >
                        <CarouselContent>
                            {products.map(({ product }) => (
                                <CarouselItem key={product.id}>
                                    <MobileProductCard product={product} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>

                {/* Desktop Carousel - Shows 4 products at a time with autoplay (hidden on mobile) */}
                <div className="hidden md:block relative">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                            slidesToScroll: 1,
                        }}
                        plugins={[
                            Autoplay({
                                delay: 5000,
                            }),
                        ]}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                            {products.map(({ product }) => (
                                <CarouselItem
                                    key={product.id}
                                    className="basis-1/4 pl-4"
                                >
                                    <ProductCard product={product} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2" />
                        <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2" />
                    </Carousel>
                </div>
            </div>
        </section>
    );
}

// Original Desktop Product Card (Redesigned)
import { useState, useEffect } from "react";

function ProductCard({ product }: { product: Product }) {
    const [isHovered, setIsHovered] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const rawPrice = product.variants?.[0]?.price ?? product.price ?? 0;
    const priceStr = convertPaiseToRupees(rawPrice);
    const price = Math.round(Number(priceStr));

    const originalPrice = product.variants?.[0]?.compareAtPrice ?? product.compareAtPrice;
    const displayPriceStr = originalPrice ? convertPaiseToRupees(originalPrice) : null;
    const displayPrice = displayPriceStr ? Math.round(Number(displayPriceStr)) : null;

    const discount = displayPrice && price ? Math.round(((Number(displayPrice) - Number(price)) / Number(displayPrice)) * 100) : null;

    const mediaUrls = Array.from(
        new Set(
            product.media
                ?.filter((media) => media.mediaItem?.url)
                .map((media) => media.mediaItem?.url || "")
        )
    ) || [];

    useEffect(() => {
        if (!isHovered) {
            setCurrentImageIndex(0);
        }
    }, [isHovered]);

    useEffect(() => {
        let slideshowInterval: number | undefined = undefined;
        if (isHovered && mediaUrls.length > 1) {
            slideshowInterval = window.setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    prevIndex === mediaUrls.length - 1 ? 0 : prevIndex + 1
                );
            }, 800);
        }
        return () => {
            if (slideshowInterval !== undefined) {
                window.clearInterval(slideshowInterval);
            }
        };
    }, [isHovered, mediaUrls.length]);

    return (
        <div 
            className="w-full group bg-white"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Card className="border-0 bg-white p-0 shadow-none">
                <CardHeader className="relative h-[400px] xl:h-[450px] p-0 overflow-hidden bg-[#F5F5F5]">
                    <AnimatedProductLink
                        href={`/products/${product.slug}`}
                        className="block h-full w-full"
                    >
                        {mediaUrls.length === 0 && (
                            <Image
                                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                alt={product.title}
                                fill
                                className={cn(
                                    "object-cover transition-all duration-300 ease-in-out",
                                    isHovered ? "scale-105" : "scale-100"
                                )}
                                sizes="(max-width: 1280px) 25vw, 300px"
                            />
                        )}
                        {mediaUrls.map((url, index) => {
                            const isActive = isHovered ? index === currentImageIndex : index === 0;
                            return (
                                <Image
                                    key={url}
                                    src={url}
                                    alt={`${product.title} ${index + 1}`}
                                    fill
                                    className={cn(
                                        "object-cover absolute inset-0 transition-all duration-300 ease-in-out",
                                        isActive ? "opacity-100 z-10" : "opacity-0 z-0",
                                        isHovered ? "scale-105" : "scale-100"
                                    )}
                                    sizes="(max-width: 1280px) 25vw, 300px"
                                />
                            );
                        })}
                    </AnimatedProductLink>

                    {/* Sale Badge */}
                    {discount && discount > 0 && (
                        <div className="absolute top-3 left-3 z-10 bg-[#D34A2E] text-white text-[10px] font-semibold tracking-wider px-2 py-1 rounded-sm">
                            Sale -{discount}%
                        </div>
                    )}

                    {/* Wishlist Button */}
                    <button className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform duration-200">
                        <Heart className="w-4 h-4 text-gray-500" />
                    </button>
                </CardHeader>

                <CardContent className="p-0 pt-4 text-center">
                    <AnimatedProductLink href={`/products/${product.slug}`}>
                        <h3 className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 mb-2 leading-snug px-2">
                            {product.title}
                        </h3>
                    </AnimatedProductLink>
                    
                    <div className="flex flex-col items-center justify-center text-[13px] font-semibold text-gray-900">
                        {displayPrice ? (
                            <div className="flex items-center gap-1.5">
                                <span>Rs. {price.toLocaleString()}</span>
                                <span className="text-gray-400 line-through font-normal text-[11px]">Rs. {displayPrice.toLocaleString()}</span>
                            </div>
                        ) : (
                            <span>Rs. {price.toLocaleString()}</span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Mobile Product Card
function MobileProductCard({ product }: { product: Product }) {
    const price = convertPaiseToRupees(
        product.variants?.[0]?.price || product.price || 0
    );

    return (
        <div className="w-full px-2">
            <Card className="border-0 bg-transparent p-0 shadow-none">
                <CardHeader className="relative aspect-square p-0">
                    <AnimatedProductLink
                        href={`/products/${product.slug}`}
                        className="block h-full"
                    >
                        <div className="relative h-full w-full overflow-hidden">
                            <Image
                                src={
                                    product.media[0]?.mediaItem?.url ||
                                    "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                }
                                alt={product.title}
                                fill
                                className="object-cover"
                                sizes="100vw"
                            />
                        </div>
                    </AnimatedProductLink>
                </CardHeader>

                <CardContent className="p-0 pt-4">
                    <h3 className="mb-2 line-clamp-2 text-base font-medium text-gray-900">
                        {product.title}
                    </h3>
                    <div className="text-base font-medium text-gray-900">
                        {/* @ts-ignore */}₹
                        {typeof price === "number" ? price.toFixed(2) : price}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
