"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface Variant {
    id: string;
    price: number;
    compareAtPrice: number;
    costPerItem: number;
}

interface Product {
    id: number;
    media: { mediaItem: { url: string } }[];
    brand: { name: string };
    title: string;
    variants?: Variant[];
    originalPrice: number;
    discountedPrice: number;
    discount: number;
    slug: string;
}

interface ProductGridProps extends React.HTMLAttributes<HTMLDivElement> {
    products: { product: Product }[];
}

export function ProductGrid({
    className,
    products,
    ...props
}: ProductGridProps) {
    if (!products || !Array.isArray(products) || products.length === 0) {
        return null;
    }

    const getPricing = (product: Product) => {
        //@ts-ignore
        if (product.variants?.length > 0) {
            //@ts-ignore
            const variant = product.variants[0];
            return {
                discountedPrice: variant.price || variant.costPerItem,
                originalPrice: variant.compareAtPrice || variant.costPerItem,
                discount:
                    (variant.compareAtPrice || variant.costPerItem) -
                    (variant.price || variant.costPerItem),
            };
        }
        return {
            discountedPrice: product.discountedPrice,
            originalPrice: product.originalPrice,
            discount: product.discount,
        };
    };

    const visibleProducts = products.slice(0, 10);
    const hasMoreProducts = products.length > 10;

    return (
        <section
            className={cn("pb-10 pt-4", className)}
            style={{ backgroundColor: "#FCFBF4" }}
            {...props}
        >
            <h2 className="mb-4 text-center text-xl font-semibold text-gray-900">
                Featured Products
            </h2>
            <div className="grid grid-cols-2 gap-3 px-1">
                {visibleProducts.map((item) => {
                    const { discountedPrice, originalPrice, discount } =
                        getPricing(item.product);
                    return (
                        <Card
                            key={item.product.id}
                            className="max-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                        >
                            <CardHeader className="relative p-0">
                                <Link
                                    href={`/products/${item.product.slug}`}
                                    className="block"
                                >
                                    <div className="relative h-40 w-full overflow-hidden">
                                        <Image
                                            src={
                                                item.product.media[0]?.mediaItem
                                                    ?.url ||
                                                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                            }
                                            alt={item.product.title}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw"
                                        />
                                    </div>
                                </Link>
                                <div className="absolute left-1 top-1">
                                    <Badge className="bg-green-100 text-[10px] text-green-800">
                                        🌿
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="bg-white p-2">
                                <div className="mb-1 text-[11px] font-medium uppercase text-gray-700">
                                    {item.product.brand.name}
                                </div>
                                <h3 className="line-clamp-2 text-sm font-medium text-gray-900">
                                    {item.product.title}
                                </h3>
                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                    <span className="text-base font-semibold leading-none text-red-600">
                                        ₹{discountedPrice}
                                    </span>
                                    <span className="text-xs leading-none text-gray-500 line-through">
                                        ₹{originalPrice}
                                    </span>
                                    <span className="text-[11px] font-medium leading-none text-orange-600">
                                        {Math.round(
                                            (discount / originalPrice) * 100
                                        )}
                                        % OFF
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
            {hasMoreProducts && (
                <div className="mt-4 text-center">
                    <Link href="/products">
                        <Button className="rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600">
                            Explore More Products
                        </Button>
                    </Link>
                </div>
            )}
        </section>
    );
}
