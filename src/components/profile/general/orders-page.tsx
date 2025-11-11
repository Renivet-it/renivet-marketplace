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
import { ReplaceModal } from "./replace-modal";
import { ReturnModal } from "./return-modal";

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

const [returnItem, setReturnItem] = useState(null);
const [replaceItem, setReplaceItem] = useState(null);
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
const [returnItem, setReturnItem] = useState(null);
const [replaceItem, setReplaceItem] = useState(null);

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
                <CardHeader>
                    <ul>
                        <li className="flex flex-col sm:flex-row items-center gap-4">
                            <OrderHeader order={order} />
                            <div className="flex-1 w-full sm:w-auto sm:flex-none">
                                {(order.status === "pending" ||
                                    order.status === "processing") && (
                                    <Button
                                        className="w-full sm:w-auto"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            setIsCancelModalOpen(true)
                                        }
                                    >
                                        Cancel Order
                                    </Button>
                                )}
                            </div>
                        </li>
                    </ul>
                </CardHeader>
                <CardContent>
                    {Object.entries(itemsByBrand).map(
                        ([brandId, { brand, items, shipment }]) => (
                            <div key={brandId} className="space-y-4">
                                <div className="flex items-center justify-between py-3">
                                    <h3 className="font-semibold">
                                        {brand.name}
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <ProductOrderCard
                                            shipmentDetails={shipment}
                                            serverNow={order.serverNow}
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
                            </div>
                        )
                    )}
                </CardContent>
         <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">

  {/* Left: View Order + Track Shipment */}
  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
    <Link
      href={`/orders/${order.id}`}
      className="text-sm underline text-gray-700 hover:text-black"
    >
      View Order Details
    </Link>

    <button
      onClick={() => {
        localStorage.setItem("trackingOrder", JSON.stringify(order));
        window.location.href = `/orders/${order.id}/tracking`;
      }}
      className="text-sm underline text-primary hover:opacity-80"
    >
      Track Shipment
    </button>
  </div>

  {/* Right: Return + Replace */}
  {order.status === "delivered" && (
    <div className="flex gap-3">
      <Button
        size="sm"
        className="bg-orange-500 hover:bg-orange-600 text-white px-5"
        onClick={() => setReturnItem(order.items[0])}
      >
        Return
      </Button>

      <Button
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white px-5"
        onClick={() => setReplaceItem(order.items[0])}
      >
        Replace
      </Button>
    </div>
  )}

  {/* Modals */}
  {returnItem && (
    <ReturnModal
      orderItem={returnItem}
      isOpen={!!returnItem}
      onClose={() => setReturnItem(null)}
    />
  )}

  {replaceItem && (
    <ReplaceModal
      orderItem={replaceItem}
      isOpen={!!replaceItem}
      onClose={() => setReplaceItem(null)}
    />
  )}

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

function OrderHeader({ order }: { order: OrderWithItemAndBrand }) {
    const getStatusIcon = () => {
        if (
            order.status === "cancelled" ||
            order.paymentStatus === "failed" ||
            order.paymentStatus === "refund_failed"
        ) {
            return "/assets/order/cancelled.svg";
        }
        if (
            order.paymentStatus === "refunded" ||
            order.paymentStatus === "refund_pending"
        ) {
            return "/assets/order/return.svg";
        }
        return "/assets/order/box.svg"; // fallback
    };

    const getStatusTick = () => {
        if (order.paymentStatus === "refunded")
            return "/assets/order/rupee.svg";

        return order.paymentStatus === "paid" || order.status === "delivered"
            ? "/assets/order/greentick.svg"
            : null;
    };

    const getStatusHeading = () => {
        switch (order.paymentStatus) {
            case "refunded":
                return "Refund Credited";
            case "refund_pending":
                return "Refund In Process";
            case "failed":
                return "Payment Failed";
            case "pending":
                return "Awaiting Payment";
            case "paid":
                return order.status === "delivered"
                    ? "Order Delivered"
                    : "Order Confirmed";
            default:
                return "Order Status";
        }
    };
const [openReturn, setOpenReturn] = useState(false);
const [openReplace, setOpenReplace] = useState(false);
    const getStatusMessage = () => {
        switch (order.paymentStatus) {
            case "refunded":
                return `Your refund of ${formatPriceTag(+convertPaiseToRupees(order.totalAmount), true)} for the return has been processed successfully.`;
            case "refund_pending":
                return `Your refund of ${formatPriceTag(+convertPaiseToRupees(order.totalAmount), true)} is being processed.`;
            case "failed":
                return "Your payment failed. Please try again.";
            case "pending":
                return `Your payment of ${formatPriceTag(+convertPaiseToRupees(order.totalAmount), true)} is pending. Please complete the payment.`;
            case "paid":
                return order.status === "delivered"
                    ? "Your order has been delivered successfully."
                    : "Your order has been placed and is being processed.";
            default:
                return "Order is being processed.";
        }
    };

 

    return (
        <>
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#696e79]">
                <img src={getStatusIcon()} alt="status-icon" />
                {getStatusTick() && (
                    <img
                        className="absolute bottom-0 right-0"
                        src={getStatusTick() ?? ""}
                        alt="tick"
                    />
                )}
            </div>
            <div className="flex-1">
                <span className="text-[14px] font-bold leading-[1] text-[#282c3f]">
                    {getStatusHeading()}
                </span>
                <p className="text-[14px] font-bold leading-[1.5] text-[#696e79]">
                    {getStatusMessage()}
                </p>
            </div>

        </>
    );
}
