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
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { cn, formatPriceTag, handleClientError } from "@/lib/utils";
import { OrderWithItemAndBrand } from "@/lib/validations";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    unavailableOrders: OrderWithItemAndBrand[];
    userId: string;
    selectedYear: number;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function UnavailableOrdersModal({
    unavailableOrders,
    userId,
    selectedYear,
    isOpen,
    setIsOpen,
}: PageProps) {
    const { refetch } = trpc.general.orders.getOrdersByUserId.useQuery({
        userId,
        year: selectedYear,
    });

    const { mutate: updateOrders, isPending: isUpdating } =
        trpc.general.orders.bulkUpdateOrderStatus.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating orders...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Orders updated", { id: toastId });
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
                        You have {unavailableOrders.length} order(s) with
                        unavailable items.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    {unavailableOrders.map((order) => {
                        const availableItems =
                            order.status === "pending"
                                ? order.items.filter(
                                      (item) =>
                                          item.product.isAvailable &&
                                          !item.product.isDeleted &&
                                          item.productVariant.isAvailable &&
                                          !item.productVariant.isDeleted &&
                                          item.productVariant.quantity > 0
                                  )
                                : order.items;

                        const unavailableItems = order.items.filter(
                            (item) =>
                                !availableItems
                                    .map((i) => i.id)
                                    .includes(item.id)
                        );

                        return (
                            <div key={order.id} className="border">
                                <div className="bg-muted p-3">
                                    <p className="text-sm font-semibold">
                                        Order ID: {order.id}
                                    </p>
                                    <p className="text-xs">
                                        {format(order.createdAt, "MMM dd yyyy")}
                                    </p>
                                </div>

                                <Separator />

                                {unavailableItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex flex-col gap-3 p-3 md:flex-row md:gap-5"
                                    >
                                        <div className="group relative aspect-[4/5] size-full max-w-36 shrink-0">
                                            <Image
                                                src={item.product.imageUrls[0]}
                                                alt={item.product.name}
                                                width={1000}
                                                height={1000}
                                                className={cn(
                                                    "size-full object-cover"
                                                )}
                                            />
                                        </div>

                                        <div className="w-full md:space-y-2">
                                            <h2 className="font-semibold leading-tight md:text-xl md:leading-normal">
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

                                            <div className="text-lg font-semibold md:text-xl">
                                                {formatPriceTag(
                                                    item.product.price,
                                                    true
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>

                <DialogFooter>
                    <Button
                        className="w-full"
                        disabled={isUpdating}
                        onClick={() => {
                            updateOrders({
                                userId,
                                orderIds: unavailableOrders.map((x) => x.id),
                                values: {
                                    paymentId: null,
                                    paymentMethod: null,
                                    paymentStatus: "failed",
                                    status: "cancelled",
                                },
                            });
                        }}
                    >
                        Got it!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
