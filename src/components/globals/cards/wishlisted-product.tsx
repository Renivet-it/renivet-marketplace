"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError } from "@/lib/utils";
import { CachedWishlist } from "@/lib/validations";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface PageProps extends GenericProps {
    wishlist: CachedWishlist;
}

export function WishlistedProductCard({
    className,
    wishlist,
    ...props
}: PageProps) {
    const [isProductHovered, setIsProductHovered] = useState(false);
    const [isAddToCartHovered, setIsAddToCartHovered] = useState(false);
    const [isCrossHovered, setIsCrossHovered] = useState(false);

    const { refetch } = trpc.general.users.wishlist.getWishlist.useQuery({
        userId: wishlist.userId,
    });

    const { mutate: removeFromWishlist, isPending: isRemoving } =
        trpc.general.users.wishlist.removeProductInWishlist.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Removing from wishlist...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                refetch();
                toast.success("Removed from wishlist", { id: toastId });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <div
            className={cn("", className)}
            title={wishlist.product.name}
            {...props}
            onMouseEnter={() => setIsProductHovered(true)}
            onMouseLeave={() => setIsProductHovered(false)}
        >
            <Link
                href={`/products/${wishlist.product.slug}`}
                onClick={(e) => {
                    if (isAddToCartHovered || isCrossHovered)
                        e.preventDefault();
                }}
                target="_blank"
                rel="noreferrer"
            >
                <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                        src={wishlist.product.imageUrls[0]}
                        alt={wishlist.product.name}
                        width={1000}
                        height={1000}
                        className="size-full object-cover"
                    />

                    <button
                        className={cn(
                            "absolute top-2 flex size-6 items-center justify-center rounded-full bg-foreground/40 text-background transition-all ease-in-out hover:bg-foreground/80 disabled:opacity-40 disabled:hover:bg-foreground/40",
                            isProductHovered
                                ? "right-2 translate-x-0"
                                : "right-0 translate-x-full"
                        )}
                        title="Remove from wishlist"
                        onMouseEnter={() => setIsCrossHovered(true)}
                        onMouseLeave={() => setIsCrossHovered(false)}
                        onClick={() =>
                            removeFromWishlist({
                                userId: wishlist.userId,
                                productId: wishlist.productId,
                            })
                        }
                        disabled={isRemoving}
                    >
                        <Icons.X className="size-4" />
                        <span className="sr-only">
                            Remove {wishlist.product.name} from wishlist
                        </span>
                    </button>

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
                                "w-full hover:bg-background hover:text-foreground"
                            )}
                            onMouseEnter={() => setIsAddToCartHovered(true)}
                            onMouseLeave={() => setIsAddToCartHovered(false)}
                            disabled={isRemoving}
                        >
                            <Icons.ShoppingCart />
                            Move to Cart
                        </Button>
                    </div>
                </div>

                <div className="space-y-1 py-2 md:p-2">
                    <div>
                        <p className="truncate text-sm font-semibold">
                            {wishlist.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {wishlist.product.brand.name}
                        </p>
                    </div>

                    <p className="text-sm font-semibold">
                        {Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                        }).format(parseFloat(wishlist.product.price))}
                    </p>
                </div>
            </Link>
        </div>
    );
}
