"use client";

import { ProductCartQuantityChangeForm } from "@/components/globals/forms";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-dash";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { addToGuestWishlist } from "@/lib/hooks/wishlist";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CachedCart } from "@/lib/validations";
import { format } from "date-fns";
import { Leaf, Minus, Plus, Recycle, RotateCcw, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
    MoveProductToWishlistModal,
    RemoveProductFromCartModal,
} from "../../../../components/globals/modals";

interface PageProps extends GenericProps {
    item: CachedCart;
    userId: string;
    readOnly?: boolean;
}

export function ProductCartCard({
    className,
    item,
    userId,
    readOnly,
    ...props
}: PageProps) {
    const [isMoveToWishlistModalOpen, setIsMoveToWishlistModalOpen] =
        useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const itemMedia = item.product.media?.[0]?.mediaItem ?? null;
    const imageUrl =
        itemMedia?.url ??
        "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
    const imageAlt = itemMedia?.alt ?? item.product.title;

    const itemPrice =
        item.variantId && item.product.variants.length > 0
            ? !!item.product.variants.find(
                  (variant) => variant.id === item.variantId
              )
                ? item.product.variants.find(
                      (variant) => variant.id === item.variantId
                  )!.price!
                : item.product.price!
            : item.product.price!;

    const { refetch } = trpc.general.users.cart.getCartForUser.useQuery({
        userId,
    });

    const { mutate: updateProduct, isPending: isUpdating } =
        trpc.general.users.cart.updateStatusInCart.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    item.status
                        ? "Deselecting from cart..."
                        : "Selecting for cart..."
                );
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success(
                    item.status ? "Deselected from cart" : "Selected for cart",
                    { id: toastId }
                );
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    // Compute estimated price per wear (assume ~180 wears for clothing items)
    const estimatedWears = 180;
    const priceInRupees = parseFloat(convertPaiseToRupees(itemPrice));
    const pricePerWear = (priceInRupees / estimatedWears).toFixed(2);

    return (
        <>
            <div
                className={cn(
                    "relative rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md",
                    className
                )}
                {...props}
            >
                <div className="flex gap-4">
                    {/* Checkbox + Image */}
                    <div className="flex items-start gap-3">
                        {!readOnly && (
                            <Checkbox
                                className="mt-1 rounded border-gray-300 data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:text-white"
                                disabled={isUpdating}
                                checked={item.status}
                                onCheckedChange={(value) =>
                                    updateProduct({
                                        userId,
                                        status: value as boolean,
                                        productId: item.product.id,
                                        variantId: item.variantId,
                                    })
                                }
                            />
                        )}

                        <div className="group relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-lg md:w-28">
                            <Image
                                src={imageUrl}
                                alt={imageAlt}
                                width={1000}
                                height={1000}
                                className={cn(
                                    "size-full object-cover",
                                    !readOnly &&
                                        "transition-all ease-in-out group-hover:brightness-90"
                                )}
                            />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 space-y-2">
                        {/* Title + Brand */}
                        <div>
                            <h3 className="text-base font-semibold leading-tight text-gray-900">
                                <Link
                                    href={`/products/${item.product.slug}`}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    className="hover:underline"
                                >
                                    {item.product.title}
                                </Link>
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                                <Link
                                    href={`/brands/${item.product.brand.id}`}
                                    className="hover:underline"
                                >
                                    By {item.product.brand.name}
                                </Link>
                            </p>
                        </div>

                        {/* Price */}
                        <div className="text-lg font-bold text-gray-900">
                            {formatPriceTag(
                                parseFloat(convertPaiseToRupees(itemPrice)),
                                true
                            )}
                        </div>

                        {/* Sustainability badges */}
                        <div className="flex flex-wrap gap-2">
                            <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5">
                                <Leaf className="size-3 text-green-600" />
                                <span className="text-[10px] font-medium text-green-700">
                                    0.8kg CO₂
                                </span>
                            </div>
                            <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5">
                                <Recycle className="size-3 text-blue-600" />
                                <span className="text-[10px] font-medium text-blue-700">
                                    8% reused
                                </span>
                            </div>
                            <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5">
                                <Icons.User className="size-3 text-orange-600" />
                                <span className="text-[10px] font-medium text-orange-700">
                                    1 artisan
                                </span>
                            </div>
                        </div>

                        {/* Estimated price per wear */}
                        <p className="text-xs text-gray-500">
                            Estimated{" "}
                            {formatPriceTag(parseFloat(pricePerWear), true)} per
                            wear ({estimatedWears} wears)
                        </p>

                        {/* Variant info */}
                        {item.variantId && (
                            <div className="text-xs text-gray-500">
                                {item.product.options.map((option) => {
                                    const selectedValue =
                                        item.product.variants.find(
                                            (v) => v.id === item.variantId
                                        )?.combinations[option.id];
                                    const optionValue = option.values.find(
                                        (v) => v.id === selectedValue
                                    );

                                    return (
                                        <p key={option.id}>
                                            <span className="font-medium">
                                                {option.name}:{" "}
                                            </span>
                                            {optionValue?.name}
                                        </p>
                                    );
                                })}
                            </div>
                        )}

                        {/* Product details toggle */}
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                            Product details
                            <Icons.ChevronDown
                                className={cn(
                                    "size-3 transition-transform",
                                    showDetails && "rotate-180"
                                )}
                            />
                        </button>
                        {showDetails && (
                            <div className="space-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                                <p>
                                    <span className="font-medium">
                                        Added on:{" "}
                                    </span>
                                    {format(
                                        new Date(item.createdAt),
                                        "MMM dd, yyyy"
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Info badges row — mobile */}
                        <div className="flex flex-wrap gap-2 md:hidden">
                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                <Truck className="size-3" />
                                <span>Free carbon-neutral shipping</span>
                            </div>
                            <div className="flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                                <RotateCcw className="size-3" />
                                10-day returns available
                            </div>
                        </div>
                    </div>

                    {/* Right side — Quantity + Remove */}
                    <div className="flex flex-col items-end justify-between">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            className="flex size-7 items-center justify-center rounded-full border border-blue-300 text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={isUpdating || readOnly}
                                            onClick={(e) => {
                                                if (readOnly)
                                                    e.preventDefault();
                                            }}
                                        >
                                            <Minus className="size-3" />
                                        </button>
                                        <span className="w-6 text-center text-sm font-medium">
                                            {item.quantity}
                                        </span>
                                        <button
                                            className="flex size-7 items-center justify-center rounded-full border border-blue-300 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={isUpdating || readOnly}
                                            onClick={(e) => {
                                                if (readOnly)
                                                    e.preventDefault();
                                            }}
                                        >
                                            <Plus className="size-3" />
                                        </button>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto rounded-lg p-3">
                                    <ProductCartQuantityChangeForm
                                        item={item}
                                        userId={userId}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Remove link */}
                        {!readOnly && (
                            <button
                                className="mt-4 text-xs font-medium text-red-500 transition-colors hover:text-red-600 hover:underline"
                                onClick={() => {
                                    setIsActionDialogOpen(true);
                                }}
                            >
                                Remove
                            </button>
                        )}

                        {/* Info badges — desktop */}
                        <div className="mt-2 hidden flex-col gap-1 md:flex">
                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                <Truck className="size-3" />
                                <span>Free carbon-neutral shipping</span>
                            </div>
                            <div className="flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700">
                                <RotateCcw className="size-3" />
                                10-day returns available
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action dialog for remove/move to wishlist */}
            <Dialog
                open={isActionDialogOpen}
                onOpenChange={setIsActionDialogOpen}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            Manage Item
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex items-start gap-3 py-2">
                        <div className="relative aspect-[4/5] max-w-20 shrink-0 overflow-hidden rounded-lg">
                            <Image
                                src={imageUrl}
                                alt={imageAlt}
                                width={1000}
                                height={1000}
                                className="size-full object-cover"
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-semibold">
                                {item.product.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {item.product.brand.name}
                            </p>
                            <p className="mt-1 text-sm font-bold">
                                {formatPriceTag(
                                    parseFloat(convertPaiseToRupees(itemPrice)),
                                    true
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setIsActionDialogOpen(false);
                                setIsMoveToWishlistModalOpen(true);
                                if (userId) {
                                    setIsMoveToWishlistModalOpen(true);
                                } else {
                                    addToGuestWishlist(
                                        item,
                                        imageUrl,
                                        itemPrice
                                    );
                                }
                            }}
                        >
                            Move to Wishlist
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                setIsActionDialogOpen(false);
                                setIsRemoveModalOpen(true);
                            }}
                        >
                            Remove
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <MoveProductToWishlistModal
                item={item}
                userId={userId}
                isOpen={isMoveToWishlistModalOpen}
                setIsOpen={setIsMoveToWishlistModalOpen}
            />

            <RemoveProductFromCartModal
                item={item}
                userId={userId}
                isOpen={isRemoveModalOpen}
                setIsOpen={setIsRemoveModalOpen}
            />
        </>
    );
}
