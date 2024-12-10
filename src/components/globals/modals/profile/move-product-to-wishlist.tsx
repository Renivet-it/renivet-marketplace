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

export function MoveProductToWishlistModal({
    item,
    userId,
    isOpen,
    setIsOpen,
}: PageProps) {
    const { refetch: refetchCart } = trpc.general.users.cart.getCart.useQuery({
        userId,
    });
    const { refetch: refetchWishlist } =
        trpc.general.users.wishlist.getWishlist.useQuery({ userId });

    const { mutate: moveProduct, isPending: isMoving } =
        trpc.general.users.cart.moveProductToWishlist.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Moving product to wishlist...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product moved to wishlist", { id: toastId });
                refetchCart();
                refetchWishlist();
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
                        Are you sure you want to move this product to your
                        wishlist?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Moving this product will remove it from your cart and
                        add it to your wishlist.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isMoving}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        size="sm"
                        disabled={isMoving}
                        onClick={() =>
                            moveProduct({
                                ...item,
                                productId: item.product.id,
                                userId,
                            })
                        }
                    >
                        Move to Wishlist
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
