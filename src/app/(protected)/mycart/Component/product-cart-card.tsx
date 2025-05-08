"use client";

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
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CachedCart } from "@/lib/validations";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ProductCartQuantityChangeForm } from "@/components/globals/forms";
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

    const itemMedia = item.product.media?.[0]?.mediaItem ?? null;
    const imageUrl = itemMedia?.url ?? "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";
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

    return (
        <>
            <div
                className={cn(
                    "relative flex items-start gap-3 border border-gray-200 rounded-md p-3 shadow-sm hover:bg-gray-50",
                    className
                )}
                {...props}
            >
                <div className="relative flex items-start gap-2">
                    {!readOnly && (
                        <Checkbox
                            className="mt-1 rounded-none border bg-muted data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
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

                    <div className="group relative aspect-[4/5] max-w-28 shrink-0">
                        <Image
                            src={imageUrl}
                            alt={imageAlt}
                            width={1000}
                            height={1000}
                            className={cn(
                                "size-full object-cover rounded-sm",
                                !readOnly &&
                                    "transition-all ease-in-out group-hover:brightness-75"
                            )}
                        />
                    </div>
                </div>

                <div className="flex-1 space-y-1">
                    <div className="space-y-0.5">
                        <h2 className="text-base font-semibold leading-tight">
                            <Link
                                href={`/products/${item.product.slug}`}
                                target="_blank"
                                referrerPolicy="no-referrer"
                            >
                                {item.product.title}
                            </Link>
                        </h2>

                        <p className="text-xs text-gray-500">
                            <Link href={`/brands/${item.product.brand.id}`}>
                                {item.product.brand.name}
                            </Link>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-lg font-bold">
                            {formatPriceTag(
                                parseFloat(convertPaiseToRupees(itemPrice)),
                                true
                            )}
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className="flex items-center gap-1 border border-gray-300 px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={isUpdating}
                                    onClick={(e) => {
                                        if (readOnly) e.preventDefault();
                                    }}
                                >
                                    <span>Qty: {item.quantity}</span>
                                    {!readOnly && (
                                        <Icons.ChevronDown className="size-3" />
                                    )}
                                </button>
                            </PopoverTrigger>

                            <PopoverContent className="rounded-none">
                                <ProductCartQuantityChangeForm
                                    item={item}
                                    userId={userId}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="text-xs text-gray-600">
                        {item.variantId && (
                            <>
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
                            </>
                        )}

                        <p>
                            <span className="font-medium">Added on: </span>
                            {format(new Date(item.createdAt), "MMM dd, yyyy")}
                        </p>
                    </div>
                </div>

                {!readOnly && (
                    <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
                        <DialogTrigger asChild>
                            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                                <Icons.X className="size-4" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle className="text-lg">Manage Item</DialogTitle>
                            </DialogHeader>

                            <div className="flex items-start gap-3 py-2">
                                <div className="relative aspect-[4/5] max-w-20 shrink-0">
                                    <Image
                                        src={imageUrl}
                                        alt={imageAlt}
                                        width={1000}
                                        height={1000}
                                        className="size-full object-cover rounded-sm"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold">{item.product.title}</h3>
                                    <p className="text-xs text-gray-500">{item.product.brand.name}</p>
                                    <p className="text-sm font-bold mt-1">
                                        {formatPriceTag(
                                            parseFloat(convertPaiseToRupees(itemPrice)),
                                            true
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsActionDialogOpen(false);
                                        setIsMoveToWishlistModalOpen(true);
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
                )}
            </div>

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