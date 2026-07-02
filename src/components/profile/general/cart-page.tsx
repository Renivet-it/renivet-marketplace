"use client";

import { ProductCartCard } from "@/components/globals/cards";
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
import {
    Notice,
    NoticeButton,
    NoticeContent,
    NoticeIcon,
    NoticeTitle,
} from "@/components/ui/notice-general";
import { Progress } from "@/components/ui/progress";
import { FREE_DELIVERY_THRESHOLD } from "@/config/const";
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

    const { data: activeRewardCartItem, refetch: refetchRewardCartItem } =
        trpc.general.swapRewards.getActiveRewardCartItem.useQuery();

    const { mutate: removeRewardCartItem, isPending: isRemovingRewardCartItem } =
        trpc.general.swapRewards.removeRewardCartItem.useMutation({
            onSuccess: () => {
                toast.success("Reward removed from cart");
                refetchRewardCartItem();
            },
            onError: (err) => handleClientError(err),
        });

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

    const totalPrice = (availableCart
    ?.filter((item) => item.status)
        .reduce((acc, item) => {
            const itemPrice = item.variantId
                ? (item.product.variants.find((v) => v.id === item.variantId)
                      ?.price ??
                  item.product.price ??
                  0)
                : (item.product.price ?? 0);
            return acc + itemPrice * item.quantity;
        }, 0)) ?? 0;

    const paidItemCount = (availableCart
    ?.filter((item) => item.status)
        .reduce((acc, item) => acc + item.quantity, 0)) ?? 0;
    const hasRewardCartItem = !!activeRewardCartItem?.selection;
    const itemCount = paidItemCount + (hasRewardCartItem ? 1 : 0);
    const hasCheckoutItems = paidItemCount > 0 || hasRewardCartItem;

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

    if (userCart?.length === 0 && !hasRewardCartItem) return <NoCartCard />;

    return (
        <>
            <div className={cn("space-y-5", className)} {...props}>
                {unavailableCart?.length > 0 && (
                    <Notice>
                        <NoticeContent>
                            <NoticeTitle>
                                <NoticeIcon />
                                <span>Warning</span>
                            </NoticeTitle>

                            <p className="text-sm">
                                {unavailableCart?.length} item(s) in your cart
                                are no longer available.
                            </p>
                        </NoticeContent>

                        <NoticeButton asChild>
                            <Button
                                size="sm"
                                className="text-xs"
                                onClick={() => setIsUnavailableModalOpen(true)}
                            >
                                Show Item(s)
                            </Button>
                        </NoticeButton>
                    </Notice>
                )}

                <div className="flex items-center justify-between gap-5 border p-4 md:gap-10 md:p-6">
                    <div className="w-full space-y-2">
                        <Progress
                            value={getProgress()}
                            className="h-4 border border-green-700 bg-transparent md:h-5"
                            indicatorClassName="bg-green-700"
                        />

                        <div className="flex items-center gap-2 text-green-700">
                            <div>
                                <Icons.CircleCheck className="size-5 rounded-full bg-green-700 stroke-background" />
                            </div>

                            <p className="text-xs md:text-sm">
                                {totalPrice < FREE_DELIVERY_THRESHOLD
                                    ? `Add ${formatPriceTag(
                                          parseFloat(
                                              convertPaiseToRupees(
                                                  FREE_DELIVERY_THRESHOLD -
                                                      totalPrice
                                              )
                                          )
                                      )} to get free delivery`
                                    : "Your order is eligible for free delivery"}
                            </p>
                        </div>
                    </div>

                    <p className="font-semibold md:text-lg">
                        {formatPriceTag(
                            parseFloat(convertPaiseToRupees(totalPrice)),
                            true
                        )}
                    </p>
                </div>

                <div className="flex items-center justify-between gap-2 border p-4 md:p-6">
                    <p className="text-sm md:text-base">{itemCount} item(s)</p>

                    <button
                        className="text-sm hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() =>
                            updateSelection({ userId, status: !isAllSelected })
                        }
                        disabled={isUpdating}
                    >
                        {isAllSelected ? "Deselect All" : "Select All"}
                    </button>
                </div>

                <div className="space-y-2">
                    {activeRewardCartItem?.selection ? (
                        <div className="rounded-2xl border border-[#e0d2b9] bg-[linear-gradient(135deg,#fffaf2_0%,#f7eddc_100%)] p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9b7a46]">
                                        Reward item
                                    </p>
                                    <h3 className="mt-1 text-base font-semibold text-[#3f2c17]">
                                        {activeRewardCartItem.selection.product.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-[#735d38]">
                                        Added as your Swap & Reward redemption.
                                        It will stay at {formatPriceTag(0)} in checkout.
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="rounded-full border border-[#d8c7ab] bg-white/75 px-3 py-1 text-xs font-medium text-[#7c5831]">
                                            Final payable {formatPriceTag(0)}
                                        </span>
                                        <span className="rounded-full border border-[#e8dac0] bg-[#fffaf1] px-3 py-1 text-xs font-medium text-[#8f6a3e]">
                                            Value{" "}
                                            {formatPriceTag(
                                                parseFloat(
                                                    convertPaiseToRupees(
                                                        activeRewardCartItem.selection.rewardValue
                                                    )
                                                ),
                                                true
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeRewardCartItem({
                                            redemptionId:
                                                activeRewardCartItem.redemption.id,
                                        })
                                    }
                                    disabled={isRemovingRewardCartItem}
                                    className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {availableCart?.map((item) => (
                        <ProductCartCard
                            item={item}
                            key={item.id}
                            userId={userId}
                        />
                    ))}
                </div>

                {process.env.NEXT_PUBLIC_IS_CHECKOUT_DISABLED === "true" && (
                    <p className="text-xs text-destructive">
                        * Checkouts are currently disabled due to testing
                    </p>
                )}

                <Button
                    className="w-full"
                    disabled={
                        !hasCheckoutItems ||
                        process.env.NEXT_PUBLIC_IS_CHECKOUT_DISABLED === "true"
                    }
                    onClick={() => {
                        if (
                            process.env.NEXT_PUBLIC_IS_CHECKOUT_DISABLED ===
                            "true"
                        )
                            return toast.error(
                                "Checkouts are currently disabled due to testing"
                            );

                        if (hasRewardCartItem) {
                            window.location.href = "/checkout";
                            return;
                        }

                        setIsCheckoutModalOpen(true);
                    }}
                >
                    {hasRewardCartItem
                        ? "Proceed to Reward Checkout"
                        : "Proceed to Checkout"}
                    <Icons.ArrowRight />
                </Button>
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
