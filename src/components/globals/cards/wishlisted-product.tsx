"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CachedWishlist } from "@/lib/validations";
import { Bell, BellRing } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoveProductToCartModal } from "../modals";

interface PageProps extends GenericProps {
    item: CachedWishlist;
}

export function WishlistedProductCard({
    className,
    item,
    ...props
}: PageProps) {
    const [isProductHovered, setIsProductHovered] = useState(false);
    const [isAddToCartHovered, setIsAddToCartHovered] = useState(false);
    const [isCrossHovered, setIsCrossHovered] = useState(false);
    const [isMoveToCartModalOpen, setIsMoveToCartModalOpen] = useState(false);
    const [priceAlertEnabled, setPriceAlertEnabled] = useState(false);
    const [stockAlertEnabled, setStockAlertEnabled] = useState(false);
    const alertKey = `renivet_wishlist_alerts_${item.productId}`;

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(alertKey);
            if (!saved) return;

            const alerts = JSON.parse(saved) as {
                price?: boolean;
                stock?: boolean;
            };
            setPriceAlertEnabled(!!alerts.price);
            setStockAlertEnabled(!!alerts.stock);
        } catch {
            setPriceAlertEnabled(false);
            setStockAlertEnabled(false);
        }
    }, [alertKey]);

    const updateAlertPreference = (type: "price" | "stock") => {
        const next = {
            price:
                type === "price" ? !priceAlertEnabled : priceAlertEnabled,
            stock:
                type === "stock" ? !stockAlertEnabled : stockAlertEnabled,
        };

        setPriceAlertEnabled(next.price);
        setStockAlertEnabled(next.stock);
        window.localStorage.setItem(alertKey, JSON.stringify(next));
        toast.success(
            next[type]
                ? `${type === "price" ? "Price drop" : "Back in stock"} alert enabled`
                : `${type === "price" ? "Price drop" : "Back in stock"} alert disabled`
        );
    };

    let productPrice = 0;

    if (!item.product.productHasVariants)
        productPrice = item.product.price || 0;
    else productPrice = Math.min(...item.product.variants.map((x) => x.price));

    const { refetch } = trpc.general.users.wishlist.getWishlist.useQuery({
        userId: item.userId,
    });

    /**
     * Helper function
     */
    function isEmptyArray(arr: Array<any>): boolean {
        return arr.length === 0;
    }

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
        <>
            <div
                className={cn("", className)}
                title={item.product.title}
                {...props}
                onMouseEnter={() => setIsProductHovered(true)}
                onMouseLeave={() => setIsProductHovered(false)}
            >
                <Link
                    href={`/products/${item.product.slug}`}
                    onClick={(e) => {
                        if (isAddToCartHovered || isCrossHovered)
                            e.preventDefault();
                    }}
                    target="_blank"
                    rel="noreferrer"
                >
                    <div className="relative aspect-[3/4] overflow-hidden">
                        {/* Product default image */}
                        {isEmptyArray(item.product?.media) && (
                            <Image
                                src="https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1"
                                alt="default image"
                                width={1000}
                                height={1000}
                                className="size-full object-cover"
                            />
                        )}
                          {/* Product when have image */}
                        {item.product?.media.length > 0 && (
                            <Image
                                src={item.product?.media[0]?.mediaItem!.url}
                                alt={
                                    item.product?.media[0]?.mediaItem!.url ??
                                    item.product.title
                                }
                                width={1000}
                                height={1000}
                                className="size-full object-cover"
                            />
                        )}

                        <button
                            className={cn(
                                "absolute top-2 hidden size-6 items-center justify-center rounded-full bg-foreground/40 text-background transition-all ease-in-out hover:bg-foreground/80 disabled:opacity-40 disabled:hover:bg-foreground/40 md:flex",
                                isProductHovered
                                    ? "right-2 translate-x-0"
                                    : "right-0 translate-x-full"
                            )}
                            title="Remove from wishlist"
                            onMouseEnter={() => setIsCrossHovered(true)}
                            onMouseLeave={() => setIsCrossHovered(false)}
                            onClick={() =>
                                removeFromWishlist({
                                    userId: item.userId,
                                    productId: item.productId,
                                })
                            }
                            disabled={isRemoving}
                        >
                            <Icons.X className="size-4" />
                            <span className="sr-only">
                                Remove {item.product.title} from wishlist
                            </span>
                        </button>

                        <div
                            className={cn(
                                "absolute bottom-0 hidden w-full p-2 transition-all ease-in-out md:inline-block",
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
                                onMouseLeave={() =>
                                    setIsAddToCartHovered(false)
                                }
                                disabled={isRemoving}
                                onClick={() => setIsMoveToCartModalOpen(true)}
                            >
                                <Icons.ShoppingCart />
                                Move to Cart
                            </Button>
                        </div>
                    </div>
                </Link>

                <div className="space-y-1 py-2 md:p-2">
                    <div>
                        <p className="truncate text-sm font-semibold">
                            {item.product.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {item.product.brand.name}
                        </p>
                    </div>

                    <p className="text-sm font-semibold">
                        {formatPriceTag(
                            parseFloat(convertPaiseToRupees(productPrice)),
                            true
                        )}
                    </p>

                    <div className="grid grid-cols-1 gap-1.5 pt-1 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => updateAlertPreference("price")}
                            className={cn(
                                "inline-flex items-center justify-center gap-1.5 rounded border px-2 py-1 text-[11px] font-medium transition-colors",
                                priceAlertEnabled
                                    ? "border-amber-300 bg-amber-50 text-amber-800"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            )}
                        >
                            {priceAlertEnabled ? (
                                <BellRing className="size-3" />
                            ) : (
                                <Bell className="size-3" />
                            )}
                            Price drop
                        </button>
                        <button
                            type="button"
                            onClick={() => updateAlertPreference("stock")}
                            className={cn(
                                "inline-flex items-center justify-center gap-1.5 rounded border px-2 py-1 text-[11px] font-medium transition-colors",
                                stockAlertEnabled
                                    ? "border-green-300 bg-green-50 text-green-800"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            )}
                        >
                            {stockAlertEnabled ? (
                                <BellRing className="size-3" />
                            ) : (
                                <Bell className="size-3" />
                            )}
                            Back in stock
                        </button>
                    </div>
                </div>

                <div className="space-y-1 md:hidden">
                    <Button
                        size="sm"
                        className="h-8 w-full text-xs"
                        disabled={isRemoving}
                        onClick={() => setIsMoveToCartModalOpen(true)}
                    >
                        Move to Cart
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-full text-xs"
                        onClick={() =>
                            removeFromWishlist({
                                userId: item.userId,
                                productId: item.productId,
                            })
                        }
                        disabled={isRemoving}
                    >
                        Remove from Wishlist
                    </Button>
                </div>
            </div>

            <MoveProductToCartModal
                item={item}
                userId={item.userId}
                isOpen={isMoveToCartModalOpen}
                setIsOpen={setIsMoveToCartModalOpen}
            />
        </>
    );
}
