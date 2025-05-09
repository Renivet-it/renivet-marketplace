"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ProductCartQuantityChangeForm } from "../forms";
import {
    MoveProductToWishlistModal,
    RemoveProductFromCartModal,
} from "../modals";

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
                key={item.id}
                className={cn(
                    "relative flex flex-col gap-3 border p-4 md:flex-row md:gap-5 md:p-6",
                    className
                )}
                {...props}
            >
                <div className="group relative aspect-[4/5] size-full max-w-36 shrink-0">
                        <Image
                            src={imageUrl}
                            alt={imageAlt}
                            width={1000}
                            height={1000}
                            className={cn(
                                "size-full object-cover",
                                !readOnly &&
                                    "transition-all ease-in-out group-hover:brightness-50"
                            )}
                        />

                    {!readOnly && (
                        <Checkbox
                            className="absolute left-2 top-2 rounded-none border bg-muted data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
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
                </div>

                <div className="w-full space-y-2 md:space-y-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold leading-tight md:text-2xl md:leading-normal">
                            <Link
                                href={`/products/${item.product.slug}`}
                                target="_blank"
                                referrerPolicy="no-referrer"
                            >
                                {item.product.title}
                            </Link>
                        </h2>

                        <p className="w-min bg-accent p-1 px-2 text-xs text-accent-foreground">
                            <Link href={`/brands/${item.product.brand.id}`}>
                                {item.product.brand.name}
                            </Link>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className="flex items-center gap-1 bg-muted px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
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

                    <div className="text-lg font-semibold md:text-xl">
                        {formatPriceTag(
                            parseFloat(convertPaiseToRupees(itemPrice)),
                            true
                        )}
                    </div>

                    <div>
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
                                        <p key={option.id} className="text-sm">
                                            <span className="font-semibold">
                                                {option.name}:{" "}
                                            </span>
                                            {optionValue?.name}
                                        </p>
                                    );
                                })}
                            </>
                        )}

                        <p className="text-sm">
                            <span className="font-semibold">Added on: </span>
                            {format(new Date(item.createdAt), "MMM dd, yyyy")}
                        </p>
                    </div>
                </div>

                {!readOnly && (
                    <div className="space-y-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsMoveToWishlistModalOpen(true)}
                        >
                            <Icons.Heart />
                            Move to Wishlist
                        </Button>

                        <Button
                            size="sm"
                            variant="destructive"
                            className="w-full"
                            onClick={() => setIsRemoveModalOpen(true)}
                        >
                            <Icons.Trash2 />
                            Remove from Cart
                        </Button>
                    </div>
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
