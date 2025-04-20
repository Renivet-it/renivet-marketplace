"use client";

import { getShiprocketBalance, updateOrderAddress } from "@/actions";
import AddAddressForm from "@/app/(protected)/profile/cart/component/address-add-form";
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
    cn,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PaymentProcessingModal } from "../globals/modals";
import { Icons } from "../icons";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button-general";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog-general";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Separator } from "../ui/separator";

// Add this type definition near the top of the file
type ItemsByBrand = Record<
    string,
    {
        brand: OrderWithItemAndBrand["items"][number]["product"]["brand"];
        items: OrderWithItemAndBrand["items"];
        shipment?: NonNullable<OrderWithItemAndBrand["shipments"]>[number];
    }
>;

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

    const [localLoading, setLocalLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);

    const { data: order, refetch } = trpc.general.orders.getOrder.useQuery(
        { id: initialData.id },
        { initialData }
    );

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
    >(undefined);

    useEffect(() => {
        if (order?.address) {
            setDeliveryAddress(order.address);
            setLocalLoading(false);
        }
    }, [order?.address]);

    const priceList = {
        items: availableItems.reduce((acc, item) => {
            const itemPrice = item.variantId
                ? (item.product.variants.find((v) => v.id === item.variantId)
                      ?.price ??
                  item.product.price ??
                  0)
                : (item.product.price ?? 0);
            return acc + itemPrice * item.quantity;
        }, 0),
        delivery: order.deliveryAmount,
        discount: order.discountAmount,
        total: order.totalAmount,
    };

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

                const hasBalance = await getShiprocketBalance();
                if (!hasBalance)
                    throw new Error(
                        "Cannot proceed with payment, please try again later"
                    );

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

    // Inside OrderPage component, add this before the return statement
    const itemsByBrand = availableItems.reduce((acc, item) => {
        const brandId = item.product.brand.id;
        if (!acc[brandId]) {
            acc[brandId] = {
                brand: item.product.brand,
                items: [],
                shipment: order.shipments?.find((s) => s.brandId === brandId),
            };
        }
        acc[brandId].items.push(item);
        return acc;
    }, {} as ItemsByBrand);

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
                            {localLoading ? (
                                <div className="flex h-24 items-center justify-center text-muted-foreground">
                                    <Loader2 className="mr-2 animate-spin" />
                                    Loading addresses...
                                </div>
                            ) : deliveryAddress ? (
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

                        <div className="flex flex-col items-start justify-end space-y-3">
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
                            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Add New Address
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Add New Address
                                        </DialogTitle>
                                    </DialogHeader>

                                    {user?.id && (
                                        <AddAddressForm
                                            user={user}
                                            onSuccess={() => {
                                                setFormOpen(false);
                                            }}
                                            onCancel={() => setFormOpen(false)}
                                        />
                                    )}
                                </DialogContent>
                            </Dialog>
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
                                        {items.map((item) => {
                                            const itemMedia =
                                                item.product.media?.[0]
                                                    ?.mediaItem ?? null;

                                            const imageUrl =
                                                itemMedia?.url ??
                                                "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNNQhfcW4g0rgXZuWwadPABUqnljV5RbJMFsx1";

                                            const imageAlt =
                                                itemMedia?.alt ??
                                                item.product.title;

                                            const itemPrice =
                                                item.variantId &&
                                                item.product.variants.length > 0
                                                    ? !!item.product.variants.find(
                                                          (variant) =>
                                                              variant.id ===
                                                              item.variantId
                                                      )
                                                        ? item.product.variants.find(
                                                              (variant) =>
                                                                  variant.id ===
                                                                  item.variantId
                                                          )!.price!
                                                        : item.product.price!
                                                    : item.product.price!;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={cn(
                                                        "relative flex flex-col gap-3 border p-4 md:flex-row md:gap-5 md:p-6"
                                                    )}
                                                >
                                                    {/* Keep existing item display code */}
                                                    <div className="group aspect-[4/5] size-full max-w-36 shrink-0">
                                                        <Image
                                                            src={imageUrl}
                                                            alt={imageAlt}
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
                                                                    {
                                                                        item
                                                                            .product
                                                                            .title
                                                                    }
                                                                </Link>
                                                            </h2>

                                                            <p className="w-min bg-accent p-1 px-2 text-xs text-accent-foreground">
                                                                <Link
                                                                    href={`/brands/${item.product.brand.id}`}
                                                                >
                                                                    {
                                                                        item
                                                                            .product
                                                                            .brand
                                                                            .name
                                                                    }
                                                                </Link>
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1 bg-muted px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
                                                                <span>
                                                                    Qty:{" "}
                                                                    {
                                                                        item.quantity
                                                                    }
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
                                                                        (
                                                                            option
                                                                        ) => {
                                                                            const selectedValue =
                                                                                item.product.variants.find(
                                                                                    (
                                                                                        v
                                                                                    ) =>
                                                                                        v.id ===
                                                                                        item.variantId
                                                                                )
                                                                                    ?.combinations[
                                                                                    option
                                                                                        .id
                                                                                ];
                                                                            const optionValue =
                                                                                option.values.find(
                                                                                    (
                                                                                        v
                                                                                    ) =>
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
                                                                    new Date(
                                                                        item.createdAt
                                                                    ),
                                                                    "MMM dd, yyyy"
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {shipment && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Icons.Truck className="size-4" />
                                            {shipment.awbNumber ? (
                                                <div className="flex items-center gap-2">
                                                    <button className="hover:underline">
                                                        <Link
                                                            href={`https://shiprocket.co/tracking/${shipment.awbNumber}`}
                                                            target="_blank"
                                                        >
                                                            Track Shipment
                                                        </Link>
                                                    </button>
                                                    {shipment.invoiceUrl && (
                                                        <>
                                                            <span>•</span>
                                                            <button className="hover:underline">
                                                                <Link
                                                                    href={
                                                                        shipment.invoiceUrl
                                                                    }
                                                                    target="_blank"
                                                                    download
                                                                >
                                                                    Download
                                                                    Invoice
                                                                </Link>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <span>
                                                    Preparing for shipment
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <Separator />
                                </div>
                            )
                        )}
                    </div>
                </div>

                <div className="hidden w-px bg-border md:inline-block" />

                <div className="h-min w-full space-y-5 border p-5 lg:max-w-96">
                    <div className="space-y-2">
                        <h2 className="font-semibold">Order Summary</h2>

                        <ul className="space-y-1">
                            <li className="flex justify-between text-sm">
                                <span>Items:</span>
                                <span>
                                    {formatPriceTag(
                                        +convertPaiseToRupees(priceList.items),
                                        true
                                    )}
                                </span>
                            </li>
                            {priceList.discount > 0 && (
                                <li className="flex justify-between text-sm text-destructive">
                                    <span>Discount:</span>
                                    <span>
                                        -
                                        {formatPriceTag(
                                            +convertPaiseToRupees(
                                                priceList.discount
                                            ),
                                            true
                                        )}
                                    </span>
                                </li>
                            )}
                            <li className="flex justify-between text-sm">
                                <span>Delivery:</span>
                                <span>
                                    {formatPriceTag(
                                        +convertPaiseToRupees(
                                            priceList.delivery
                                        ),
                                        true
                                    )}
                                </span>
                            </li>
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
                                    unavailableItems.length > 0
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
