"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-general";
import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { CachedCart } from "@/lib/validations";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    item: CachedCart;
    userId: string;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function RemoveProductFromCartModal({
    item,
    userId,
    isOpen,
    setIsOpen,
}: PageProps) {
    const { refetch } = trpc.general.users.cart.getCart.useQuery({ userId });

    const { mutate: removeProduct, isPending: isRemoving } =
        trpc.general.users.cart.removeProductInCart.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Removing product from cart...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product removed from cart", { id: toastId });
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to remove this product from your
                        cart?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Removing this product will also remove all instaces of
                        it from your cart. You can also try to move it to your
                        wishlist.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isRemoving}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isRemoving}
                        onClick={() =>
                            removeProduct({
                                ...item,
                                productId: item.product.id,
                                userId,
                            })
                        }
                    >
                        Remove
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
