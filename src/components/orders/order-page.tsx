"use client";

import { updateOrderAddress } from "@/actions";
import {
    Notice,
    NoticeButton,
    NoticeContent,
    NoticeIcon,
    NoticeTitle,
} from "@/components/ui/notice-general";
import {
    createRazorpayPaymentOptions,
    initializeRazorpayPayment,
} from "@/lib/razorpay/payment";
import { trpc } from "@/lib/trpc/client";
import {
    calculateTotalPrice,
    cn,
    convertMsToHumanReadable,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PaymentProcessingModal } from "../globals/modals";
import { Icons } from "../icons";
import { Button } from "../ui/button-general";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog-general";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Separator } from "../ui/separator";

interface PageProps extends GenericProps {
    initialData: OrderWithItemAndBrand;
    user: CachedUser;
}

export function OrderPage({
    className,
    initialData,
    user,
    ...props
}: PageProps) {
    const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
    const [processingModalTitle, setProcessingModalTitle] = useState("");
    const [processingModalDescription, setProcessingModalDescription] =
        useState("");
    const [processingModalState, setProcessingModalState] = useState<
        "pending" | "success" | "error"
    >("pending");

    const [isProcessing, setIsProcessing] = useState(false);

    const [isAddressChangeModalOpen, setIsAddressChangeModalOpen] =
        useState(false);

    const { data: order, refetch } = trpc.general.orders.getOrder.useQuery(
        { id: initialData.id },
        { initialData }
    );

    const [timeRemaining, setTimeRemaining] = useState<number>(
        new Date(order.createdAt).getTime() + 900000 - Date.now()
    );

    const { mutate: updateOrder, isPending: isUpdating } =
        trpc.general.orders.updateOrderStatus.useMutation({
            onSuccess: () => {
                refetch();
            },
        });

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(
                new Date(order.createdAt).getTime() + 900000 - Date.now()
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [order.createdAt]);

    useEffect(() => {
        if (timeRemaining > 0) return;
        if (
            timeRemaining <= 0 &&
            ["paid", "refund_pending", "refunded", "refund_failed"].includes(
                order.paymentStatus
            )
        )
            return;
        if (isProcessing) return;
        if (isUpdating) return;

        updateOrder({
            orderId: order.id,
            userId: user.id,
            values: {
                status: "cancelled",
                paymentMethod: null,
                paymentId: null,
                paymentStatus: "failed",
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRemaining, order.paymentStatus]);

    const availableItems =
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
              )
            : order.items;

    const unavailableItems = order.items.filter(
        (item) => !availableItems.map((i) => i.id).includes(item.id)
    );

    const [deliveryAddress, setDeliveryAddress] = useState<
        CachedUser["addresses"][number] | undefined
    >(user.addresses?.find((address) => address.isPrimary));

    const priceList = calculateTotalPrice(
        availableItems.map((item) => {
            const itemPrice = item.variantId
                ? (item.product.variants.find((v) => v.id === item.variantId)
                      ?.price ??
                  item.product.price ??
                  0)
                : (item.product.price ?? 0);
            return itemPrice * item.quantity;
        }) || []
    );

    const { mutate: initPayment, isPending: isPaymentInitializing } =
        useMutation({
            onMutate: () => {
                const toastId = toast.loading("Initializing payment...");
                return { toastId };
            },
            mutationFn: async ({ orderId }: { orderId: string }) => {
                if (!deliveryAddress)
                    throw new Error("Select a delivery address");

                if (unavailableItems.length > 0)
                    throw new Error("Some items are no longer available");

                if (order.addressId !== deliveryAddress.id)
                    await updateOrderAddress({
                        orderId,
                        addressId: deliveryAddress.id,
                    });

                setIsProcessing(true);

                const options = createRazorpayPaymentOptions({
                    orderId,
                    deliveryAddress,
                    prices: priceList,
                    user,
                    setIsProcessing,
                    setIsProcessingModalOpen,
                    setProcessingModalTitle,
                    setProcessingModalDescription,
                    setProcessingModalState,
                    refetch,
                });

                initializeRazorpayPayment(options);
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Payment initialized", { id: toastId });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <>
            <div
                className={cn(
                    "flex flex-col-reverse justify-between gap-5 lg:flex-row",
                    className
                )}
                {...props}
            >
                <div className="w-full space-y-5 p-1 md:p-5">
                    <div className="grid grid-cols-3 gap-5 md:grid-cols-6">
                        <div className="hidden font-semibold md:inline-block">
                            1.
                        </div>

                        <div className="font-semibold">Delivery Address</div>

                        <div className="md:col-span-3">
                            {deliveryAddress ? (
                                <div className="space-y-1">
                                    <div className="font-semibold">
                                        {deliveryAddress.fullName}
                                    </div>

                                    <div className="text-sm">
                                        {deliveryAddress.street}
                                    </div>

                                    <div className="text-sm">
                                        {deliveryAddress.city},{" "}
                                        {deliveryAddress.state}
                                    </div>

                                    <div className="text-sm">
                                        {deliveryAddress.phone}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No address found
                                </div>
                            )}
                        </div>

                        <div className="flex items-start justify-end">
                            <button
                                className="text-xs text-primary hover:underline md:text-sm"
                                onClick={() => {
                                    if (order.paymentStatus === "paid") return;

                                    if (user.addresses.length === 0)
                                        return window.open(
                                            "/profile/addresses",
                                            "_blank"
                                        );
                                    setIsAddressChangeModalOpen(true);
                                }}
                            >
                                Change
                            </button>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
                        <div className="hidden font-semibold md:inline-block">
                            2.
                        </div>
                        <div className="font-semibold">Review Items</div>
                    </div>

                    <div className="space-y-2">
                        {unavailableItems.length > 0 && (
                            <Notice>
                                <NoticeContent>
                                    <NoticeTitle>
                                        <NoticeIcon />
                                        <span>Warning</span>
                                    </NoticeTitle>

                                    <p className="text-sm">
                                        {unavailableItems.length} item(s) are no
                                        longer available.
                                    </p>
                                </NoticeContent>

                                <NoticeButton asChild>
                                    <Button size="sm" className="text-xs">
                                        Show Item(s)
                                    </Button>
                                </NoticeButton>
                            </Notice>
                        )}

                        {availableItems.map((item) => {
                            const itemMedia =
                                item.variantId &&
                                item.product.variants.length > 0
                                    ? !!item.product.variants.find(
                                          (variant) =>
                                              variant.id === item.variantId
                                      )
                                        ? item.product.variants.find(
                                              (variant) =>
                                                  variant.id === item.variantId
                                          )!.mediaItem!
                                        : item.product.media![0].mediaItem!
                                    : item.product.media![0].mediaItem!;

                            const itemPrice =
                                item.variantId &&
                                item.product.variants.length > 0
                                    ? !!item.product.variants.find(
                                          (variant) =>
                                              variant.id === item.variantId
                                      )
                                        ? item.product.variants.find(
                                              (variant) =>
                                                  variant.id === item.variantId
                                          )!.price!
                                        : item.product.price!
                                    : item.product.price!;

                            return (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "relative flex flex-col gap-3 border p-4 md:flex-row md:gap-5 md:p-6",
                                        className
                                    )}
                                    {...props}
                                >
                                    <div className="group aspect-[4/5] size-full max-w-36 shrink-0">
                                        <Image
                                            src={itemMedia.url}
                                            alt={
                                                itemMedia.alt ??
                                                item.product.title
                                            }
                                            width={1000}
                                            height={1000}
                                            className="size-full object-cover"
                                        />
                                    </div>

                                    <div className="w-full space-y-2 md:space-y-4">
                                        <div className="space-y-1">
                                            <h2 className="text-lg font-semibold leading-tight md:text-2xl md:leading-normal">
                                                <Link
                                                    href={`/products/${item.product.slug}`}
                                                    target="_blank"
                                                    referrerPolicy="no-referrer"
                                                >
                                                    {item.product.title}
                                                </Link>
                                            </h2>

                                            <p className="w-min bg-accent p-1 px-2 text-xs text-accent-foreground">
                                                <Link
                                                    href={`/brands/${item.product.brand.id}`}
                                                >
                                                    {item.product.brand.name}
                                                </Link>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-muted px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
                                                <span>
                                                    Qty: {item.quantity}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-lg font-semibold md:text-xl">
                                            {formatPriceTag(
                                                parseFloat(
                                                    convertPaiseToRupees(
                                                        itemPrice
                                                    )
                                                ),
                                                true
                                            )}
                                        </div>

                                        <div>
                                            {item.variantId && (
                                                <>
                                                    {item.product.options.map(
                                                        (option) => {
                                                            const selectedValue =
                                                                item.product.variants.find(
                                                                    (v) =>
                                                                        v.id ===
                                                                        item.variantId
                                                                )?.combinations[
                                                                    option.id
                                                                ];
                                                            const optionValue =
                                                                option.values.find(
                                                                    (v) =>
                                                                        v.id ===
                                                                        selectedValue
                                                                );

                                                            return (
                                                                <p
                                                                    key={
                                                                        option.id
                                                                    }
                                                                    className="text-sm"
                                                                >
                                                                    <span className="font-semibold">
                                                                        {
                                                                            option.name
                                                                        }
                                                                        :{" "}
                                                                    </span>
                                                                    {
                                                                        optionValue?.name
                                                                    }
                                                                </p>
                                                            );
                                                        }
                                                    )}
                                                </>
                                            )}

                                            <p className="text-sm">
                                                <span className="font-semibold">
                                                    Added on:{" "}
                                                </span>
                                                {format(
                                                    new Date(item.createdAt),
                                                    "MMM dd, yyyy"
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="hidden w-px bg-border md:inline-block" />

                <div className="h-min w-full space-y-5 border p-5 lg:max-w-96">
                    <div className="space-y-2">
                        <h2 className="font-semibold">Order Summary</h2>

                        <ul className="space-y-1">
                            {Object.entries(priceList)
                                .filter(([key]) => key !== "total")
                                .map(([key, value]) => (
                                    <li
                                        key={key}
                                        className="flex justify-between text-xs"
                                    >
                                        <span>{convertValueToLabel(key)}:</span>
                                        <span>
                                            {formatPriceTag(
                                                +convertPaiseToRupees(value),
                                                true
                                            )}
                                        </span>
                                    </li>
                                ))}
                        </ul>

                        <Separator />

                        <div className="flex justify-between font-semibold text-destructive">
                            <span>Total:</span>
                            <span>
                                {formatPriceTag(
                                    +convertPaiseToRupees(priceList.total),
                                    true
                                )}
                            </span>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Button
                                size="sm"
                                className="w-full"
                                disabled={
                                    isProcessing ||
                                    !deliveryAddress ||
                                    isPaymentInitializing ||
                                    order.paymentStatus === "paid" ||
                                    order.status !== "pending" ||
                                    unavailableItems.length > 0 ||
                                    isUpdating
                                }
                                variant={
                                    unavailableItems.length > 0
                                        ? "destructive"
                                        : order.paymentStatus === "pending"
                                          ? "default"
                                          : order.paymentStatus === "paid"
                                            ? "accent"
                                            : order.paymentStatus === "failed"
                                              ? "destructive"
                                              : "secondary"
                                }
                                onClick={() =>
                                    initPayment({ orderId: order.id })
                                }
                            >
                                {unavailableItems.length > 0
                                    ? "Aborted"
                                    : order.paymentStatus === "pending"
                                      ? "Pay Now"
                                      : order.paymentStatus === "paid"
                                        ? "Already Paid"
                                        : order.paymentStatus === "failed" &&
                                            order.status === "pending"
                                          ? "Retry Payment"
                                          : order.paymentStatus ===
                                              "refund_pending"
                                            ? "Refund Pending"
                                            : order.paymentStatus === "refunded"
                                              ? "Refunded"
                                              : order.paymentStatus ===
                                                  "refund_failed"
                                                ? "Refund Failed"
                                                : "Order Cancelled"}
                            </Button>

                            {![
                                "paid",
                                "refund_pending",
                                "refunded",
                                "refund_failed",
                            ].includes(order.paymentStatus) &&
                                timeRemaining > 0 &&
                                order.status !== "cancelled" && (
                                    <p className="text-xs text-destructive">
                                        *{" "}
                                        <span className="font-semibold">
                                            {convertMsToHumanReadable(
                                                timeRemaining
                                            )}
                                        </span>{" "}
                                        until order is cancelled
                                    </p>
                                )}

                            <p className="text-xs text-destructive">
                                * By placing an order, you agree to our{" "}
                                <Link
                                    href="/terms"
                                    target="_blank"
                                    className="underline"
                                >
                                    Terms of Service
                                </Link>{" "}
                                and{" "}
                                <Link
                                    href="/privacy"
                                    target="_blank"
                                    className="underline"
                                >
                                    Privacy Policy
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog
                open={isAddressChangeModalOpen}
                onOpenChange={setIsAddressChangeModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Change Delivery Address</DialogTitle>
                        <DialogDescription>
                            Select a delivery address from the list below
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1">
                        <RadioGroup
                            defaultValue={deliveryAddress?.id}
                            onValueChange={(value) =>
                                setDeliveryAddress(
                                    user.addresses.find(
                                        (address) => address.id === value
                                    )
                                )
                            }
                        >
                            {user.addresses
                                .sort((a) => (a.isPrimary ? -1 : 1))
                                .map((address) => (
                                    <div
                                        key={address.id}
                                        className="flex items-center gap-5 p-4 transition-all ease-in-out hover:bg-muted"
                                    >
                                        <RadioGroupItem
                                            value={address.id}
                                            id={address.id}
                                        />
                                        <Label htmlFor={address.id}>
                                            <div className="space-y-1">
                                                <div>
                                                    <span className="font-semibold">
                                                        {address.fullName}
                                                    </span>{" "}
                                                    <span>
                                                        {address.street},
                                                    </span>{" "}
                                                    <span>
                                                        {address.city},{" "}
                                                        {address.state}
                                                    </span>
                                                </div>

                                                <div className="text-sm">
                                                    {address.phone}
                                                </div>
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                        </RadioGroup>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button className="w-full" asChild>
                                <Link href="/profile/addresses" target="_blank">
                                    Add New Address
                                    <Icons.ArrowRight />
                                </Link>
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PaymentProcessingModal
                isOpen={isProcessingModalOpen}
                setIsOpen={setIsProcessingModalOpen}
                title={processingModalTitle}
                description={processingModalDescription}
                state={processingModalState}
            />
        </>
    );
}
