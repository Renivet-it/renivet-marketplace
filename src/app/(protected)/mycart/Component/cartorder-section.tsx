"use client";

import {
    CheckoutModal,
    UnavailableItemsModal,
} from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import { FREE_DELIVERY_THRESHOLD } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { cn, handleClientError } from "@/lib/utils";
import { CachedCart } from "@/lib/validations";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ProductCartCard } from "./product-cart-card";

interface PageProps extends GenericProps {
    initialData: CachedCart[];
    userId: string;
}

export function CartPage({
    className,
    initialData,
    userId,
    ...props
}: PageProps) {
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isUnavailableModalOpen, setIsUnavailableModalOpen] = useState(false);

    const { data: userCart, refetch } =
        trpc.general.users.cart.getCartForUser.useQuery(
            { userId },
            { initialData }
        );

    const availableCart = userCart?.filter(
        (c) =>
            c.product.isPublished &&
            c.product.verificationStatus === "approved" &&
            !c.product.isDeleted &&
            c.product.isAvailable &&
            (!!c.product.quantity ? c.product.quantity > 0 : true) &&
            c.product.isActive &&
            (!c.variant ||
                (c.variant && !c.variant.isDeleted && c.variant.quantity > 0))
    );

    const unavailableCart = userCart?.filter(
        (item) => !availableCart.map((i) => i.id).includes(item.id)
    );

    const totalPrice = availableCart
        ?.filter((item) => item.status)
        .reduce((acc, item) => {
            const itemPrice = item.variantId
                ? (item.product.variants.find((v) => v.id === item.variantId)
                      ?.price ??
                  item.product.price ??
                  0)
                : (item.product.price ?? 0);
            return acc + itemPrice * item.quantity;
        }, 0);

    const itemCount = availableCart
        ?.filter((item) => item.status)
        .reduce((acc, item) => acc + item.quantity, 0);

    const getProgress = () => {
        const progress = (totalPrice / FREE_DELIVERY_THRESHOLD) * 100;
        return progress > 100 ? 100 : progress;
    };

    const isAllSelected = availableCart?.every((item) => item.status);

    const { mutate: updateSelection, isPending: isUpdating } =
        trpc.general.users.cart.updateStatusInCart.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    isAllSelected
                        ? "Deselecting all items..."
                        : "Selecting all items..."
                );
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success(
                    isAllSelected
                        ? "Deselected all items"
                        : "Selected all items",
                    { id: toastId }
                );
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    if (userCart?.length === 0) return <NoCartCard />;

    return (
        <>
            <div className={cn("space-y-4", className)} {...props}>
                {/* Unavailable items warning */}
                {unavailableCart?.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                <Icons.AlertTriangle className="size-4 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-900">
                                    A mindful note:{" "}
                                    {unavailableCart?.length === 1
                                        ? "One item in your bag is"
                                        : `${unavailableCart?.length} items in your bag are`}{" "}
                                    no longer available. We recommend reviewing
                                    your selection.
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="mt-3 w-full rounded-lg bg-green-600 text-xs hover:bg-green-700 md:mt-0 md:w-auto"
                            onClick={() => setIsUnavailableModalOpen(true)}
                        >
                            Review Unavailable Items
                        </Button>
                    </div>
                )}

                {/* Item count header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h2 className="text-base font-semibold text-gray-900">
                        {itemCount} Thoughtful{" "}
                        {itemCount === 1 ? "Choice" : "Choices"}
                    </h2>
                    <button
                        className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() =>
                            updateSelection({ userId, status: !isAllSelected })
                        }
                        disabled={isUpdating}
                    >
                        {isAllSelected ? "Deselect All" : "Select All"}
                    </button>
                </div>

                {/* Cart items */}
                <div className="space-y-4">
                    {availableCart?.map((item) => (
                        <ProductCartCard
                            item={item}
                            key={item.id}
                            userId={userId}
                        />
                    ))}
                </div>

                {/* Wishlist link */}
                <Link
                    href="profile/wishlist"
                    className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                    <div className="flex items-center gap-2">
                        <Icons.Bookmark className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                            Add More From Wishlist
                        </span>
                    </div>
                    <Icons.ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                {process.env.NEXT_PUBLIC_IS_CHECKOUT_DISABLED === "true" && (
                    <p className="text-xs text-destructive">
                        * Checkouts are currently disabled due to testing
                    </p>
                )}
            </div>

            <CheckoutModal
                isOpen={isCheckoutModalOpen}
                setIsOpen={setIsCheckoutModalOpen}
                userId={userId}
            />

            <UnavailableItemsModal
                isOpen={isUnavailableModalOpen}
                setIsOpen={setIsUnavailableModalOpen}
                unavailableCart={unavailableCart}
                userId={userId}
            />
        </>
    );
}

function NoCartCard() {
    return (
        <div className="flex flex-col items-center justify-center gap-5 p-6">
            <EmptyPlaceholder
                isBackgroundVisible={false}
                className="w-full max-w-full border-none"
            >
                <EmptyPlaceholderIcon>
                    <Icons.AlertTriangle className="size-10" />
                </EmptyPlaceholderIcon>

                <EmptyPlaceholderContent>
                    <EmptyPlaceholderTitle>
                        Your cart is empty
                    </EmptyPlaceholderTitle>
                    <EmptyPlaceholderDescription>
                        Continue shopping and keep adding products to your cart.
                    </EmptyPlaceholderDescription>
                </EmptyPlaceholderContent>

                <Button asChild>
                    <Link href="/shop">Continue Shopping</Link>
                </Button>
            </EmptyPlaceholder>
        </div>
    );
}
