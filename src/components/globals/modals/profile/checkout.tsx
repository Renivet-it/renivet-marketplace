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
import {
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useMemo } from "react";
import { toast } from "sonner";

interface PageProps {
    userId: string;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function CheckoutModal({ userId, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const { data: userCart } = trpc.general.users.cart.getCartForUser.useQuery({
        userId,
    });
    const { data: user, isPending: isUserFetching } =
        trpc.general.users.currentUser.useQuery();

    const availableCart = useMemo(
        () =>
            userCart?.filter(
                (c) =>
                    c.product.isPublished &&
                    c.product.verificationStatus === "approved" &&
                    !c.product.isDeleted &&
                    c.product.isAvailable &&
                    (!!c.product.quantity ? c.product.quantity > 0 : true) &&
                    c.product.isActive &&
                    (!c.variant ||
                        (c.variant &&
                            !c.variant.isDeleted &&
                            c.variant.quantity > 0))
            ) || [],
        [userCart]
    );

    const itemsCount = useMemo(
        () =>
            availableCart
                .filter((item) => item.status)
                .reduce((acc, item) => acc + item.quantity, 0) || 0,
        [availableCart]
    );

    const totalPrice = useMemo(
        () =>
            availableCart
                .filter((item) => item.status)
                .reduce((acc, item) => {
                    const itemPrice = item.variantId
                        ? (item.product.variants.find(
                              (v) => v.id === item.variantId
                          )?.price ??
                          item.product.price ??
                          0)
                        : (item.product.price ?? 0);
                    return acc + itemPrice * item.quantity;
                }, 0) || 0,
        [availableCart]
    );

    const { mutate: createOrder, isPending: isOrderCreating } =
        trpc.general.orders.createOrder.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating your order...");
                return { toastId };
            },
            onSuccess: (newOrder, _, { toastId }) => {
                toast.success("Order created, redirecting to payment page...", {
                    id: toastId,
                });
                router.push(`/orders/${newOrder.id}`);
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
                        Are you sure you want to proceed with the checkout?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        You are about to checkout{" "}
                        <span className="font-semibold">{itemsCount}</span>{" "}
                        items of total{" "}
                        <span className="font-semibold">
                            {formatPriceTag(
                                parseFloat(convertPaiseToRupees(totalPrice)),
                                true
                            )}
                        </span>{" "}
                        (excluding gateway fee and optional delivery charges).
                        <br />
                        <br />
                        Proceeding will create an order and will redirect you to
                        the payment page. This will also remove the items from
                        your cart.
                        <br />
                        <br />
                        You will have to complete the payment within{" "}
                        <span className="font-semibold">15 minutes</span>{" "}
                        otherwise the order will be cancelled.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    {/* <Button
                        size="sm"
                        disabled={isUserFetching || isOrderCreating}
                        onClick={() => {
                            if (!user)
                                return toast.error(
                                    DEFAULT_MESSAGES.ERRORS.USER_FETCHING
                                );

                            createOrder({
                                userId,
                                addressId: user.addresses.find(
                                    (add) => add.isPrimary
                                )!.id,
                                deliveryAmount: priceList.devliery.toString(),
                                taxAmount: priceList.platform.toString(),
                                discountAmount: "0",
                                paymentMethod: null,
                                totalAmount: priceList.total.toString(),
                                totalItems:
                                    userCart?.filter((item) => item.status)
                                        .length || 0,
                                items:
                                    userCart
                                        ?.filter((item) => item.status)
                                        .map((item) => ({
                                            price: item.product.price,
                                            brandId: item.product.brandId,
                                            productId: item.product.id,
                                            quantity: item.quantity,
                                            size: item.size,
                                            color: item.color,
                                        })) || [],
                            });
                        }}
                    >
                        Proceed to checkout
                    </Button> */}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
