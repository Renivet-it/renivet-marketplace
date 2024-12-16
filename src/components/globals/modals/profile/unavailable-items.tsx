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
import { cn, formatPriceTag, handleClientError } from "@/lib/utils";
import { CachedCart } from "@/lib/validations";
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
    const { refetch } = trpc.general.users.cart.getCart.useQuery({ userId });

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
                        You have {unavailableCart.length} item(s) in your cart
                        that are no longer available.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {unavailableCart.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col gap-3 bg-muted p-3 md:flex-row md:gap-5"
                        >
                            <div className="group relative aspect-[4/5] size-full max-w-36 shrink-0">
                                <Image
                                    src={item.product.imageUrls[0]}
                                    alt={item.product.name}
                                    width={1000}
                                    height={1000}
                                    className={cn("size-full object-cover")}
                                />
                            </div>

                            <div className="w-full space-y-2 md:space-y-4">
                                <div className="space-y-1">
                                    <h2 className="text-lg font-semibold leading-tight md:text-2xl md:leading-normal">
                                        <Link
                                            href={`/products/${item.product.slug}`}
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                        >
                                            {item.product.name}
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

                                <div className="text-lg font-semibold md:text-xl">
                                    {formatPriceTag(
                                        parseFloat(item.product.price),
                                        true
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button
                        className="w-full"
                        disabled={isRemoving}
                        onClick={() => {
                            removeProducts({
                                userId,
                                productIds: unavailableCart.map(
                                    (x) => x.productId
                                ),
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
