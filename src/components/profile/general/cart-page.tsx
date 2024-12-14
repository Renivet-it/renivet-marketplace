"use client";

import { ProductCartCard } from "@/components/globals/cards";
import { CheckoutModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    EmptyPlaceholder,
    EmptyPlaceholderContent,
    EmptyPlaceholderDescription,
    EmptyPlaceholderIcon,
    EmptyPlaceholderTitle,
} from "@/components/ui/empty-placeholder-general";
import { Progress } from "@/components/ui/progress";
import { FREE_DELIVERY_THRESHOLD } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { cn, formatPriceTag, handleClientError } from "@/lib/utils";
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

    const { data: userCart, refetch } =
        trpc.general.users.cart.getCart.useQuery({ userId }, { initialData });

    const totalPrice = userCart
        .filter((item) => item.status)
        .reduce(
            (acc, item) => acc + parseFloat(item.product.price) * item.quantity,
            0
        );

    const itemCount = userCart
        .filter((item) => item.status)
        .reduce((acc, item) => acc + item.quantity, 0);

    const getProgress = () => {
        const progress = (totalPrice / FREE_DELIVERY_THRESHOLD) * 100;
        return progress > 100 ? 100 : progress;
    };

    const isAllSelected = userCart.every((item) => item.status);

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

    if (userCart.length === 0) return <NoCartCard />;

    return (
        <>
            <div className={cn("space-y-5", className)} {...props}>
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
                                          FREE_DELIVERY_THRESHOLD - totalPrice,
                                          true
                                      )} to get free delivery`
                                    : "Your order is eligible for free delivery"}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm font-semibold md:text-base">
                        {formatPriceTag(totalPrice, true)}
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
                    {userCart.map((item) => (
                        <ProductCartCard
                            item={item}
                            key={item.id}
                            userId={userId}
                        />
                    ))}
                </div>

                <Button
                    className="w-full"
                    disabled={totalPrice === 0}
                    onClick={() => setIsCheckoutModalOpen(true)}
                >
                    Proceed to Checkout
                    <Icons.ArrowRight />
                </Button>
            </div>

            <CheckoutModal
                isOpen={isCheckoutModalOpen}
                setIsOpen={setIsCheckoutModalOpen}
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
