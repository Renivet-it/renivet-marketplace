"use client";

import { ProductCartCard } from "@/components/globals/cards";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import { Progress } from "@/components/ui/progress";
import { FREE_DELIVERY_THRESHOLD } from "@/config/const";
import { trpc } from "@/lib/trpc/client";
import { cn, formatPriceTag, handleClientError } from "@/lib/utils";
import { CachedCart } from "@/lib/validations";
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

    return (
        <div className={cn("space-y-5", className)} {...props}>
            <div className="flex items-center justify-between gap-10 border p-4 md:p-6">
                <div className="w-full space-y-2">
                    <Progress
                        value={getProgress()}
                        className="h-5 border border-green-700 bg-transparent"
                        indicatorClassName="bg-green-700"
                    />

                    <div className="flex items-center gap-2 text-green-700">
                        <Icons.CircleCheck className="size-5 rounded-full bg-green-700 stroke-background" />

                        <p className="text-sm">
                            {totalPrice < FREE_DELIVERY_THRESHOLD
                                ? `Add ${formatPriceTag(
                                      FREE_DELIVERY_THRESHOLD - totalPrice,
                                      true
                                  )} to get free delivery`
                                : "Your order is eligible for free delivery"}
                        </p>
                    </div>
                </div>

                {formatPriceTag(totalPrice, true)}
            </div>

            <div className="flex items-center justify-between gap-2 border p-4 md:p-6">
                <div>{itemCount} item(s)</div>

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

            <Button className="w-full">
                Proceed to Checkout
                <Icons.ArrowRight />
            </Button>
        </div>
    );
}
