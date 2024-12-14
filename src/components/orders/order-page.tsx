"use client";

import {
    createRazorPayOptions,
    initializeRazorpayPayment,
} from "@/lib/razorpay/client";
import { trpc } from "@/lib/trpc/client";
import {
    calculateTotalPrice,
    cn,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { CachedUser, OrderWithItemAndBrand } from "@/lib/validations";
import Link from "next/link";
import { useState } from "react";
import { ProductCartCard } from "../globals/cards";
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

    const { data: order } = trpc.general.orders.getOrder.useQuery(
        { id: initialData.id },
        { initialData }
    );

    const [deliveryAddress, setDeliveryAddress] = useState<
        CachedUser["addresses"][number] | undefined
    >(user.addresses?.find((address) => address.isPrimary));

    const priceList = calculateTotalPrice(
        order.items.map((item) => item.product.price * item.quantity) || []
    );

    const handlePayment = async (orderId: string) => {
        setIsProcessing(true);
        if (!deliveryAddress) throw new Error("Select a delivery address");

        const options = createRazorPayOptions({
            orderId,
            deliveryAddress,
            prices: priceList,
            user,
            setIsProcessing,
            setIsProcessingModalOpen,
            setProcessingModalTitle,
            setProcessingModalDescription,
            setProcessingModalState,
        });

        initializeRazorpayPayment(options);
    };

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
                        {order.items.map((item) => (
                            <ProductCartCard
                                item={{
                                    ...item,
                                    userId: user.id,
                                    status: true,
                                    product: {
                                        ...item.product,
                                        price: item.product.price.toString(),
                                    },
                                }}
                                key={item.id}
                                userId={user.id}
                                readOnly
                            />
                        ))}
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
                                            {formatPriceTag(value, true)}
                                        </span>
                                    </li>
                                ))}
                        </ul>

                        <Separator />

                        <div className="flex justify-between font-semibold text-destructive">
                            <span>Total:</span>
                            <span>{formatPriceTag(priceList.total, true)}</span>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Button
                                size="sm"
                                className="w-full"
                                disabled={
                                    isProcessing ||
                                    !deliveryAddress ||
                                    order.paymentStatus === "paid"
                                }
                                variant={
                                    order.paymentStatus === "pending"
                                        ? "default"
                                        : order.paymentStatus === "paid"
                                          ? "accent"
                                          : order.paymentStatus === "failed"
                                            ? "destructive"
                                            : "secondary"
                                }
                                onClick={() => handlePayment(order.id)}
                            >
                                {order.paymentStatus === "pending"
                                    ? "Pay Now"
                                    : order.paymentStatus === "paid"
                                      ? "Already Paid"
                                      : order.paymentStatus === "failed"
                                        ? "Retry Payment"
                                        : "Payment Pending"}
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
