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
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
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
                <div className="rounded-[24px] border border-[#e7e1d6] bg-[linear-gradient(135deg,#ffffff_0%,#fbf8f1_100%)] p-4 shadow-[0_24px_60px_-44px_rgba(31,43,35,0.35)] md:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e3da] bg-white px-3 py-1 text-11 font-semibold uppercase tracking-[0.16em] text-[#56705d]">
                                <Icons.ShoppingBag className="size-3.5" />
                                Ready to check out
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#1e2a23] md:text-2xl">
                                    Review your thoughtful picks
                                </h2>
                                <p className="mt-1 max-w-[60ch] text-sm leading-6 text-[#69766b]">
                                    Keep only what you love, save more with
                                    eligible offers, and move to checkout with
                                    confidence.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
                            <div className="rounded-2xl border border-[#ebe5da] bg-white p-3">
                                <p className="text-11 font-semibold uppercase tracking-[0.14em] text-[#8a8f86]">
                                    Selected items
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-[#1f2b24]">
                                    {itemCount || 0}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-[#ebe5da] bg-white p-3">
                                <p className="text-11 font-semibold uppercase tracking-[0.14em] text-[#8a8f86]">
                                    Current subtotal
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-[#1f2b24]">
                                    {formatPriceTag(totalPrice ? parseFloat(convertPaiseToRupees(totalPrice)) : 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unavailable items warning */}
                {unavailableCart?.length > 0 && (
                    <div className="rounded-2xl border border-amber-200/80 bg-[linear-gradient(135deg,#fff8eb_0%,#fff3d9_100%)] p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                    <Icons.AlertTriangle className="size-4 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-900">
                                        Some items need attention before
                                        checkout
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-amber-800/85">
                                        {unavailableCart?.length === 1
                                            ? "One item in your bag is no longer available."
                                            : `${unavailableCart?.length} items in your bag are no longer available.`}{" "}
                                        Review them now to keep your checkout
                                        smooth.
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="w-full rounded-xl bg-[#6B7A5E] text-xs hover:bg-[#5a6950] md:w-auto"
                                onClick={() => setIsUnavailableModalOpen(true)}
                            >
                                Review Unavailable Items
                            </Button>
                        </div>
                    </div>
                )}

                {/* Item count header */}
                <div className="flex items-center justify-between rounded-2xl border border-[#ece7de] bg-white px-4 py-3">
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
                    className="flex items-center justify-between rounded-[22px] border border-[#e6e1d7] bg-[linear-gradient(135deg,#ffffff_0%,#f8f6ef_100%)] p-4 transition-all hover:border-[#d6cec0] hover:shadow-[0_18px_40px_-34px_rgba(31,43,35,0.28)]"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-[#eef3ee]">
                            <Icons.Bookmark className="size-4 text-[#607765]" />
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-gray-800">
                                Add more from Wishlist
                            </span>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Bring saved favorites back into this order
                            </p>
                        </div>
                    </div>
                    <Icons.ChevronRight className="size-4 text-gray-400" />
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
