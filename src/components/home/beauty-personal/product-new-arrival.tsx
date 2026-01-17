"use client";

import { Button } from "@/components/ui/button-general";
import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
    slug: string;
    id: string;
    media: { mediaItem: { url: string } }[];
    title: string;
    subtitle?: string;
    description?: string;
    variants?: {
        price: number;
    }[];
    price?: number;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
    products: { product: Product }[];
    title?: string;
}

export function ProductGridNewArrivals({
    className,
    products,
    title = "NEW ARRIVALS",
    ...props
}: ProductGridProps) {
    if (!products || !Array.isArray(products) || products.length === 0) {
        return null;
    }

    return (
        <section
            className={cn("w-full bg-[#FCFBF4] px-4 py-8", className)}
            {...props}
        >
            <div className="mx-auto max-w-[1360px]">
                {/* Header with View All link */}
                <div className="mb-6 flex items-center justify-between px-2">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">
                        {title}
                    </h1>
                    <Link
                        href="#"
                        className="text-sm font-medium underline hover:text-gray-600"
                    >
                        See All
                    </Link>
                </div>

                {/* Mobile Carousel */}
                <div className="md:hidden">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {products.map(({ product }) => (
                                <CarouselItem
                                    key={product.id}
                                    className="basis-[80%] pl-4"
                                >
                                    <MobileProductCard product={product} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>

                {/* Desktop Carousel */}
                <div className="hidden md:block">
                    <Carousel
                        opts={{
                            align: "start",
                            loop: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent>
                            {products.map(({ product }) => (
                                <CarouselItem
                                    key={product.id}
                                    className="basis-[25%] pl-4"
                                >
                                    <ProductCard product={product} />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            </div>
        </section>
    );
}

function ProductCard({ product }: { product: Product }) {
    const router = useRouter();
    const price = convertPaiseToRupees(
        product.variants?.[0]?.price || product.price || 0
    );

    const handleAddToBag = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/products/${product.slug}`);
    };

    return (
        <Link href={`/products/${product.slug}`} passHref>
            <Card className="flex h-full flex-col border-0 bg-transparent p-0 shadow-none hover:cursor-pointer">
                {/* Product Image */}
                <div className="relative mb-4 aspect-square overflow-hidden">
                    <Image
                        src={
                            product.media[0]?.mediaItem?.url ||
                            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                        }
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                    />
                </div>

                {/* Product Info */}
                <CardContent className="flex flex-1 flex-col items-center justify-between p-0">
                    <div className="flex w-full flex-col items-center">
                        {/* Product Name */}
                        <h3 className="mb-2 text-center text-base font-semibold text-gray-900">
                            {product.title}
                        </h3>
                        {/* Price */}
                        <div className="mb-6 text-center text-lg font-bold text-gray-900">
                            {/* @ts-ignore */}
                            {typeof price === "number"
                                ? price.toFixed(2)
                                : price}
                        </div>
                    </div>
                    {/* Full-width View Button */}
                    <Button
                        variant="outline"
                        className="h-12 w-full border border-black px-3 py-2 text-base hover:bg-[#FCFBF4] hover:text-black"
                        onClick={handleAddToBag}
                    >
                        View
                    </Button>
                </CardContent>
            </Card>
        </Link>
    );
}

function MobileProductCard({ product }: { product: Product }) {
    const router = useRouter();
    const price = convertPaiseToRupees(
        product.variants?.[0]?.price || product.price || 0
    );

    const handleAddToBag = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/products/${product.slug}`);
    };

    return (
        <Link href={`/products/${product.slug}`} passHref>
            <Card className="border-0 bg-transparent p-0 shadow-none hover:cursor-pointer">
                {/* Product Image */}
                <div className="relative mb-3 aspect-square overflow-hidden">
                    <Image
                        src={
                            product.media[0]?.mediaItem?.url ||
                            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                        }
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="80vw"
                    />
                </div>

                {/* Product Info */}
                <CardContent className="p-0">
                    {/* Brand Name */}
                    <div className="mb-1 text-xs font-bold uppercase tracking-wider">
                        {product.title.split(" ")[0]}
                    </div>

                    {/* Product Name */}
                    <h3 className="mb-1 text-sm font-medium text-gray-900">
                        {product.subtitle || product.title}
                    </h3>

                    {/* Description */}
                    {product.description && (
                        <p className="mb-2 line-clamp-2 text-xs text-gray-500">
                            {product.description}
                        </p>
                    )}

                    {/* Price and Add to Bag - INLINE */}
                    <div className="flex items-center justify-between">
                        <div className="text-base font-bold text-gray-900">
                            {/* @ts-ignore */}$
                            {typeof price === "number"
                                ? price.toFixed(2)
                                : price}
                        </div>
                        <Button
                            variant="outline"
                            className="h-8 border border-black px-3 py-1 text-xs hover:bg-black hover:text-white"
                            onClick={handleAddToBag}
                        >
                            Add To Bag
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
