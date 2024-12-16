"use client";

import { ProductOrderCard } from "@/components/globals/cards";
import { UnavailableOrdersModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-general";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import {
    calculateTotalPrice,
    cn,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";

interface PageProps extends GenericProps {
    initialData: OrderWithItemAndBrand[];
    user: CachedUser;
}

export function OrdersPage({
    className,
    initialData,
    user,
    ...props
}: PageProps) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    const { data: orders } = trpc.general.orders.getOrdersByUserId.useQuery(
        { userId: user.id, year: selectedYear },
        { initialData }
    );

    const userCreatedAtYear = new Date(user.createdAt).getFullYear();

    const availableOrders = orders.filter((order) =>
        order.status === "pending"
            ? order.items.filter(
                  (item) =>
                      item.product.isAvailable &&
                      item.product.status &&
                      item.product.sizes.filter((size) => size.quantity > 0)
                          .length > 0
              ).length > 0
            : true
    );

    const unavailableOrders = orders.filter((order) =>
        order.status === "pending"
            ? order.items.filter(
                  (item) =>
                      !item.product.isAvailable ||
                      !item.product.status ||
                      item.product.sizes.filter((size) => size.quantity > 0)
                          .length === 0
              ).length > 0
            : false
    );

    return (
        <>
            <div className={cn("space-y-5", className)} {...props}>
                <div className="flex items-center gap-5">
                    <p className="text-sm">
                        <span className="font-semibold">{orders.length}</span>{" "}
                        order(s) placed
                    </p>

                    <div>
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(value) => setSelectedYear(+value)}
                        >
                            <SelectTrigger className="min-w-36">
                                <SelectValue placeholder="Select Year" />
                            </SelectTrigger>

                            <SelectContent>
                                {Array.from(
                                    {
                                        length:
                                            new Date().getFullYear() -
                                            userCreatedAtYear +
                                            1,
                                    },
                                    (_, i) => userCreatedAtYear + i
                                )
                                    .reverse()
                                    .map((year) => (
                                        <SelectItem
                                            value={year.toString()}
                                            key={year}
                                        >
                                            {year}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {unavailableOrders.length > 0 && (
                    <Notice>
                        <NoticeContent>
                            <NoticeTitle>
                                <NoticeIcon />
                                <span>Warning</span>
                            </NoticeTitle>

                            <p className="text-sm">
                                {unavailableOrders.length} order(s) contain
                                item(s) that are no longer available.
                            </p>
                        </NoticeContent>

                        <NoticeButton asChild>
                            <Button
                                size="sm"
                                className="text-xs"
                                onClick={() => setIsOrderModalOpen(true)}
                            >
                                Show Order(s)
                            </Button>
                        </NoticeButton>
                    </Notice>
                )}

                {availableOrders.length === 0 ? (
                    <NoOrdersCard />
                ) : (
                    availableOrders.map((order, i) => {
                        const shippingAddress = user.addresses.find(
                            (address) => address.id === order.addressId
                        );

                        const availableItems =
                            order.status === "pending"
                                ? order.items.filter(
                                      (item) =>
                                          item.product.isAvailable &&
                                          item.product.status &&
                                          item.product.sizes.filter(
                                              (size) => size.quantity > 0
                                          ).length > 0
                                  )
                                : order.items;

                        const unavailableItems = order.items.filter(
                            (item) =>
                                !availableItems
                                    .map((i) => i.id)
                                    .includes(item.id)
                        );

                        return (
                            <div key={order.id} className="space-y-5">
                                <div className="border">
                                    <div className="flex flex-col justify-between gap-2 bg-primary p-4 text-primary-foreground md:flex-row md:items-center md:gap-5 md:p-6">
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-10">
                                            <div className="space-y-1">
                                                <p className="text-xs uppercase">
                                                    Order Placed
                                                </p>
                                                <p className="text-sm">
                                                    {format(
                                                        new Date(
                                                            order.createdAt
                                                        ),
                                                        "MMMM dd, yyyy"
                                                    )}
                                                </p>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs uppercase">
                                                    Total
                                                </p>
                                                <p className="text-sm">
                                                    {formatPriceTag(
                                                        calculateTotalPrice(
                                                            availableItems.map(
                                                                (item) =>
                                                                    item.product
                                                                        .price *
                                                                    item.quantity
                                                            ) || []
                                                        ).total,
                                                        true
                                                    )}
                                                </p>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs uppercase">
                                                    Ship To
                                                </p>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button className="cursor-pointer text-sm hover:underline">
                                                            {
                                                                shippingAddress?.fullName
                                                            }
                                                        </button>
                                                    </PopoverTrigger>

                                                    <PopoverContent className="rounded-none">
                                                        <p className="text-sm">
                                                            {
                                                                shippingAddress?.street
                                                            }
                                                        </p>

                                                        <p className="text-sm">
                                                            {
                                                                shippingAddress?.city
                                                            }
                                                            ,{" "}
                                                            {
                                                                shippingAddress?.state
                                                            }
                                                        </p>

                                                        <p className="text-sm">
                                                            {
                                                                shippingAddress?.phone
                                                            }
                                                        </p>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>

                                        <div className="space-y-1 md:text-end">
                                            <div className="flex items-center gap-px text-sm">
                                                <p>Order #</p>
                                                <p>{order.id}</p>
                                            </div>

                                            <button className="text-sm hover:underline">
                                                <Link
                                                    href={`/orders/${order.id}`}
                                                >
                                                    View Order Details
                                                </Link>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-5 p-2 md:p-6">
                                        <div className="space-y-2">
                                            <div className="flex flex-col justify-between gap-2 bg-muted p-4 md:flex-row md:items-center md:p-4 md:px-6">
                                                <div className="flex items-center gap-1">
                                                    <p className="text-sm font-semibold">
                                                        Order Status:
                                                    </p>
                                                    <Badge
                                                        className="rounded-none"
                                                        variant={
                                                            unavailableItems.length >
                                                            0
                                                                ? "destructive"
                                                                : order.status ===
                                                                    "delivered"
                                                                  ? "secondary"
                                                                  : order.status ===
                                                                      "cancelled"
                                                                    ? "destructive"
                                                                    : "default"
                                                        }
                                                    >
                                                        {unavailableItems.length ===
                                                        0
                                                            ? convertValueToLabel(
                                                                  order.status
                                                              )
                                                            : "Aborted"}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <p className="text-sm font-semibold">
                                                        Payment Status:
                                                    </p>
                                                    <Badge
                                                        className="rounded-none"
                                                        variant={
                                                            unavailableItems.length >
                                                            0
                                                                ? "destructive"
                                                                : order.paymentStatus ===
                                                                        "paid" ||
                                                                    order.paymentStatus ===
                                                                        "refunded"
                                                                  ? "secondary"
                                                                  : order.paymentStatus ===
                                                                          "pending" ||
                                                                      order.paymentStatus ===
                                                                          "refund_pending"
                                                                    ? "default"
                                                                    : "destructive"
                                                        }
                                                    >
                                                        {unavailableItems.length ===
                                                        0
                                                            ? convertValueToLabel(
                                                                  order.paymentStatus
                                                              )
                                                            : "Aborted"}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <p className="text-sm font-semibold">
                                                        Payment Method:
                                                    </p>
                                                    <p className="text-sm">
                                                        {convertValueToLabel(
                                                            order.paymentMethod ??
                                                                "N/A"
                                                        )}
                                                    </p>
                                                </div>

                                                {unavailableItems.length >
                                                    0 && (
                                                    <div className="flex items-center gap-1">
                                                        <p className="text-sm font-semibold">
                                                            Unavailable Items:
                                                        </p>
                                                        <p className="text-sm">
                                                            {
                                                                unavailableItems.length
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {unavailableItems.length === 0 &&
                                                order.status === "pending" &&
                                                (order.paymentStatus ===
                                                    "pending" ||
                                                    order.paymentStatus ===
                                                        "failed") && (
                                                    <div className="flex flex-col justify-between gap-2 bg-destructive p-2 md:flex-row md:items-center md:p-1 md:px-6">
                                                        <p className="text-sm text-destructive-foreground">
                                                            * Order is pending.
                                                            Please complete the
                                                            payment to proceed.
                                                        </p>

                                                        <Button
                                                            size="sm"
                                                            variant="link"
                                                            className="h-auto w-min self-end p-0 text-destructive-foreground md:h-9 md:w-auto md:self-auto md:px-3"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/orders/${order.id}`}
                                                            >
                                                                Complete Payment
                                                                <Icons.ArrowRight />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                )}

                                            {order.status === "cancelled" &&
                                                order.paymentStatus ===
                                                    "paid" && (
                                                    <p className="text-sm text-destructive">
                                                        * Order has been
                                                        cancelled. Please
                                                        contact support for more
                                                        information.
                                                    </p>
                                                )}

                                            {order.status === "delivered" &&
                                                order.paymentStatus ===
                                                    "paid" && (
                                                    <p className="text-sm text-accent">
                                                        * Order has been
                                                        delivered. Thank you for
                                                        shopping with us.
                                                    </p>
                                                )}
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            {availableItems.map((item) => (
                                                <ProductOrderCard
                                                    item={item}
                                                    key={item.id}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {i !== orders.length - 1 && <Separator />}
                            </div>
                        );
                    })
                )}
            </div>

            <UnavailableOrdersModal
                isOpen={isOrderModalOpen}
                setIsOpen={setIsOrderModalOpen}
                unavailableOrders={unavailableOrders}
                selectedYear={selectedYear}
                userId={user.id}
            />
        </>
    );
}

function NoOrdersCard() {
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
                        You have no orders
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
