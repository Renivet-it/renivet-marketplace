"use client";

import { Button } from "@/components/ui/button-general";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-general";
import { trpc } from "@/lib/trpc/client";
import {
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CachedCart } from "@/lib/validations";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    unavailableCart: CachedCart[];
    userId: string;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function UnavailableItemsModal({
    unavailableCart,
    userId,
    isOpen,
    setIsOpen,
}: PageProps) {
    const { refetch } = trpc.general.users.cart.getCartForUser.useQuery({
        userId,
    });

    const { mutate: removeProducts, isPending: isRemoving } =
        trpc.general.users.cart.removeProductsInCart.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Removing items from cart...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Items removed from cart", { id: toastId });
                refetch();
                setIsOpen(false);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="[&>button]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle>Unavailable Items</DialogTitle>
                    <DialogDescription>
                        You have {unavailableCart?.length} item(s) in your cart
                        that are no longer available.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {unavailableCart?.map((item) => {
                        const itemMedia =
                            item.variantId && item.product.variants.length > 0
                                ? !!item.product.variants.find(
                                      (variant) => variant.id === item.variantId
                                  )
                                    ? item.product.variants.find(
                                          (variant) =>
                                              variant.id === item.variantId
                                      )!.mediaItem!
                                    : item.product.media![0].mediaItem!
                                : item.product.media![0].mediaItem!;

                        const itemPrice =
                            item.variantId && item.product.variants.length > 0
                                ? !!item.product.variants.find(
                                      (variant) => variant.id === item.variantId
                                  )
                                    ? item.product.variants.find(
                                          (variant) =>
                                              variant.id === item.variantId
                                      )!.price!
                                    : item.product.price!
                                : item.product.price!;

                        return (
                            <div
                                key={item.id}
                                className="flex flex-col gap-3 bg-muted p-3 md:flex-row md:gap-5"
                            >
                                <div className="group relative aspect-[4/5] size-full max-w-36 shrink-0">
                                    <Image
                                        src={itemMedia.url}
                                        alt={
                                            itemMedia.alt ?? item.product.title
                                        }
                                        width={1000}
                                        height={1000}
                                        className="size-full object-cover"
                                    />
                                </div>

                                <div className="w-full space-y-2">
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
                                            <Link
                                                href={`/brands/${item.product.brand.id}`}
                                            >
                                                {item.product.brand.name}
                                            </Link>
                                        </p>
                                    </div>

                                    <div className="text-sm font-semibold md:text-lg">
                                        {formatPriceTag(
                                            parseFloat(
                                                convertPaiseToRupees(itemPrice)
                                            ),
                                            true
                                        )}
                                    </div>

                                    <div>
                                        {item.variantId && (
                                            <>
                                                {item.product.options.map(
                                                    (option) => {
                                                        const selectedValue =
                                                            item.product.variants.find(
                                                                (v) =>
                                                                    v.id ===
                                                                    item.variantId
                                                            )?.combinations[
                                                                option.id
                                                            ];
                                                        const optionValue =
                                                            option.values.find(
                                                                (v) =>
                                                                    v.id ===
                                                                    selectedValue
                                                            );

                                                        return (
                                                            <p
                                                                key={option.id}
                                                                className="text-sm"
                                                            >
                                                                <span className="font-semibold">
                                                                    {
                                                                        option.name
                                                                    }
                                                                    :{" "}
                                                                </span>
                                                                {
                                                                    optionValue?.name
                                                                }
                                                            </p>
                                                        );
                                                    }
                                                )}
                                            </>
                                        )}

                                        <p className="text-sm">
                                            <span className="font-semibold">
                                                Added on:{" "}
                                            </span>
                                            {format(
                                                new Date(item.createdAt),
                                                "MMM dd, yyyy"
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <DialogFooter>
                    <Button
                        className="w-full"
                        disabled={isRemoving}
                        onClick={() => {
                            removeProducts({
                                userId,
                                items: unavailableCart?.map((item) => ({
                                    productId: item.productId,
                                    variantId: item.variantId,
                                })),
                            });
                        }}
                    >
                        Ok, and remove permanently!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
