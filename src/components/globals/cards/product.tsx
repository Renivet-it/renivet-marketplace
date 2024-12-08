"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

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

    const { refetch } = trpc.general.users.wishlist.getWishlist.useQuery(
        { userId: userId! },
        { enabled: !!userId }
    );

    const { mutate: addToWishlist } =
        trpc.general.users.wishlist.addProductInWishlist.useMutation({
            onMutate: () => {
                setIsProductWishlisted(!isProductWishlisted);
                toast.success(
                    isProductWishlisted
                        ? "Removed from wishlist"
                        : "Added to wishlist"
                );
            },
            onSuccess: () => {
                refetch();
            },
            onError: (err) => {
                toast.error(err.message);
                setIsProductWishlisted(isWishlisted);
            },
        });

    const { mutate: removeFromWishlist } =
        trpc.general.users.wishlist.removeProductInWishlist.useMutation({
            onMutate: () => {
                setIsProductWishlisted(!isProductWishlisted);
                toast.success(
                    isProductWishlisted
                        ? "Removed from wishlist"
                        : "Added to wishlist"
                );
            },
            onSuccess: () => {
                refetch();
            },
            onError: (err) => {
                toast.error(err.message);
                setIsProductWishlisted(isWishlisted);
            },
        });

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
                            className={cn(
                                "w-full hover:bg-background hover:text-foreground",
                                isProductWishlisted &&
                                    "bg-background font-semibold text-primary hover:bg-muted",
                                !userId && "hidden"
                            )}
                            onMouseEnter={() => setIsWishlistHovered(true)}
                            onMouseLeave={() => setIsWishlistHovered(false)}
                            onClick={() =>
                                isProductWishlisted
                                    ? removeFromWishlist({
                                          userId: userId!,
                                          productId: product.id,
                                      })
                                    : addToWishlist({
                                          userId: userId!,
                                          productId: product.id,
                                      })
                            }
                        >
                            <Icons.Heart
                                className={cn(
                                    isProductWishlisted &&
                                        "fill-primary stroke-primary"
                                )}
                            />
                            {isProductWishlisted ? "Wishlisted" : "Wishlist"}
                        </Button>
                    </div>
                </div>

                <div className="space-y-1 py-2 md:p-2">
                    <div>
                        <p className="truncate text-sm font-semibold">
                            {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {product.brand.name}
                        </p>
                    </div>

                    <p className="text-sm font-semibold">
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
