"use client";

import { ProductOrderCard } from "@/components/globals/cards";
import { UnavailableOrdersModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-general";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
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
    cn,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import { format } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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

    const availableOrders = useMemo(
        () =>
            orders.filter((order) =>
                order.status === "pending"
                    ? order.items.filter(
                          (item) =>
                              item.product.verificationStatus === "approved" &&
                              !item.product.isDeleted &&
                              item.product.isAvailable &&
                              (!!item.product.quantity
                                  ? item.product.quantity > 0
                                  : true) &&
                              (!item.variant ||
                                  (item.variant &&
                                      !item.variant.isDeleted &&
                                      item.variant.quantity > 0))
                      ).length > 0
                    : true
            ),
        [orders]
    );

    const unavailableOrders = useMemo(
        () =>
            orders.filter((order) =>
                order.status === "pending"
                    ? order.items.filter(
                          (item) =>
                              item.product.verificationStatus !== "approved" &&
                              item.product.isDeleted &&
                              !item.product.isAvailable &&
                              (!!item.product.quantity
                                  ? item.product.quantity === 0
                                  : true) &&
                              (!item.variant ||
                                  (item.variant &&
                                      item.variant.isDeleted &&
                                      item.variant.quantity === 0))
                      ).length > 0
                    : false
            ),
        [orders]
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
                    availableOrders.map((order) => {
                        const shippingAddress = user.addresses.find(
                            (address) => address.id === order.addressId
                        );

                        const availableItems =
                            order.status === "pending"
                                ? order.items.filter(
                                      (item) =>
                                          item.product.verificationStatus ===
                                              "approved" &&
                                          !item.product.isDeleted &&
                                          item.product.isAvailable &&
                                          (!!item.product.quantity
                                              ? item.product.quantity > 0
                                              : true) &&
                                          (!item.variant ||
                                              (item.variant &&
                                                  !item.variant.isDeleted &&
                                                  item.variant.quantity > 0))
                                  )
                                : order.items;

                        const unavailableItems = order.items.filter(
                            (item) =>
                                !availableItems
                                    .map((i) => i.id)
                                    .includes(item.id)
                        );

                        return (
                            <OrderCard
                                order={order}
                                unavailableItems={unavailableItems}
                                availableItems={availableItems}
                                shippingAddress={shippingAddress}
                                selectedYear={selectedYear}
                                key={order.id}
                            />
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

interface OrderCardProps {
    order: OrderWithItemAndBrand;
    unavailableItems: OrderWithItemAndBrand["items"];
    availableItems: OrderWithItemAndBrand["items"];
    shippingAddress?: CachedUser["addresses"][number];
    selectedYear: number;
}

function OrderCard({
    order,
    unavailableItems,
    availableItems,
    shippingAddress,
    selectedYear,
}: OrderCardProps) {
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const { refetch } = trpc.general.orders.getOrdersByUserId.useQuery({
        userId: order.userId,
        year: selectedYear,
    });

    const { mutate: cancelOrder, isPending: isCancelling } =
        trpc.general.orders.cancelOrder.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Cancelling order...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                setIsCancelModalOpen(false);
                toast.success("Order cancelled successfully", { id: toastId });
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    type OrderShipment = NonNullable<
        OrderWithItemAndBrand["shipments"]
    >[number];

    const itemsByBrand = availableItems.reduce(
        (acc, item) => {
            const brandId = item.product.brand.id;
            if (!acc[brandId]) {
                acc[brandId] = {
                    brand: item.product.brand,
                    items: [],
                    shipment: order.shipments?.find(
                        (s) => s.brandId === brandId
                    ),
                };
            }
            acc[brandId].items.push(item);
            return acc;
        },
        {} as Record<
            string,
            {
                brand: (typeof availableItems)[number]["product"]["brand"];
                items: typeof availableItems;
                shipment?: OrderShipment;
            }
        >
    );

    return (
        <>
            <Card className="rounded-none">
                <CardHeader className="bg-primary p-4 py-6 text-primary-foreground md:p-6">
                    <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                            <p className="text-xs uppercase">Order Placed</p>
                            <p className="text-sm">
                                {format(
                                    new Date(order.createdAt),
                                    "MMMM dd, yyyy"
                                )}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs uppercase">Total</p>
                            <p className="text-sm">
                                {formatPriceTag(
                                    +convertPaiseToRupees(order.totalAmount),
                                    true
                                )}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-medium">ORDER #</p>
                            <p className="text-sm">{order.id}</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 p-4 md:p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                            <Badge variant="secondary" className="h-6">
                                Order Status:{" "}
                                {convertValueToLabel(order.status)}
                            </Badge>

                            <Badge variant="secondary" className="h-6">
                                Payment Status:{" "}
                                {convertValueToLabel(order.paymentStatus)}
                            </Badge>
                        </div>

                        {(order.status === "pending" ||
                            order.status === "processing") && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsCancelModalOpen(true)}
                            >
                                Cancel Order
                            </Button>
                        )}
                    </div>

                    {unavailableItems.length === 0 &&
                        order.status === "pending" &&
                        (order.paymentStatus === "pending" ||
                            order.paymentStatus === "failed") && (
                            <div className="flex items-center gap-2 bg-muted/50 p-4 text-sm text-muted-foreground">
                                <Icons.AlertCircle className="size-5" />

                                <p>
                                    Order is pending. Please complete the
                                    payment to proceed.
                                </p>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="ml-auto"
                                    asChild
                                >
                                    <Link href={`/orders/${order.id}`}>
                                        Complete Payment
                                        <Icons.ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                            </div>
                        )}

                    <Separator />

                    {/* Group products by brand */}
                    {Object.entries(itemsByBrand).map(
                        ([brandId, { brand, items, shipment }]) => (
                            <div key={brandId} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">
                                        {brand.name}
                                    </h3>
                                    {shipment && (
                                        <Badge variant="outline">
                                            Shipment Status:{" "}
                                            {convertValueToLabel(
                                                shipment.status
                                            )}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <ProductOrderCard
                                            item={item}
                                            key={item.id}
                                            trackingInfo={
                                                shipment && {
                                                    trackingNumber:
                                                        shipment.trackingNumber,
                                                    awbNumber:
                                                        shipment.awbNumber,
                                                    estimatedDelivery:
                                                        shipment.estimatedDeliveryDate,
                                                }
                                            }
                                        />
                                    ))}
                                </div>

                                {shipment && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Icons.Truck className="size-4" />
                                        {shipment.awbNumber ? (
                                            <button className="hover:underline">
                                                <Link
                                                    href={`https://shiprocket.co/tracking/${shipment.awbNumber}`}
                                                    target="_blank"
                                                >
                                                    Track Shipment
                                                </Link>
                                            </button>
                                        ) : (
                                            <span>Preparing for shipment</span>
                                        )}
                                    </div>
                                )}

                                <Separator />
                            </div>
                        )
                    )}
                </CardContent>

                <CardFooter className="bg-muted/50 p-4 md:p-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Icons.Package className="size-4 md:size-5" />
                        <div>
                            <span className="text-sm md:text-base">
                                Ship to:{" "}
                            </span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button className="cursor-pointer text-sm hover:underline md:text-base">
                                        {shippingAddress?.fullName}
                                    </button>
                                </PopoverTrigger>

                                <PopoverContent className="rounded-none">
                                    <p className="text-sm">
                                        {shippingAddress?.street}
                                    </p>

                                    <p className="text-sm">
                                        {shippingAddress?.city},{" "}
                                        {shippingAddress?.state}
                                    </p>

                                    <p className="text-sm">
                                        {shippingAddress?.phone}
                                    </p>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <button className="ml-auto underline-offset-2 hover:underline">
                        <Link href={`/orders/${order.id}`} className="text-sm">
                            View Order Details
                        </Link>
                    </button>
                </CardFooter>
            </Card>

            <AlertDialog
                open={isCancelModalOpen}
                onOpenChange={setIsCancelModalOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to cancel this order?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cancelling this order will not be reversible. Refund
                            will be initiated if payment has been made.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isCancelling}
                            onClick={() => setIsCancelModalOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isCancelling}
                            onClick={() =>
                                cancelOrder({
                                    orderId: order.id,
                                    userId: order.userId,
                                })
                            }
                        >
                            Cancel Order
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
