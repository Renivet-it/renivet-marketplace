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
    cn,
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
                                    src={item.item.imageUrls[0]}
                                    alt={item.item.name}
                                    width={1000}
                                    height={1000}
                                    className={cn("size-full object-cover")}
                                />
                            </div>

                            <div className="w-full space-y-2">
                                <div className="space-y-1">
                                    <h2 className="font-semibold leading-tight md:text-xl md:leading-normal">
                                        <Link
                                            href={`/products/${item.item.slug}`}
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                        >
                                            {item.item.name}
                                        </Link>
                                    </h2>

                                    <p className="w-min bg-accent p-1 px-2 text-xs text-accent-foreground">
                                        <Link
                                            href={`/brands/${item.item.brand.id}`}
                                        >
                                            {item.item.brand.name}
                                        </Link>
                                    </p>
                                </div>

                                <div className="text-sm font-semibold md:text-lg">
                                    {formatPriceTag(
                                        parseFloat(
                                            convertPaiseToRupees(
                                                item.item.price
                                            )
                                        ),
                                        true
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm">
                                        <span className="font-semibold">
                                            Size:{" "}
                                        </span>
                                        {item.size}
                                    </p>

                                    <p className="text-sm">
                                        <span className="font-semibold">
                                            Color:{" "}
                                        </span>
                                        {item.color.name}
                                    </p>

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
                    ))}
                </div>

                <DialogFooter>
                    <Button
                        className="w-full"
                        disabled={isRemoving}
                        onClick={() => {
                            removeProducts({
                                userId,
                                skus: unavailableCart.map((item) => item.sku),
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
