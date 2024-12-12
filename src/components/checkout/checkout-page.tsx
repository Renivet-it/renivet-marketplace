"use client";

import { trpc } from "@/lib/trpc/client";
import {
    calculateTotalPrice,
    cn,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { CachedCart, CachedUser } from "@/lib/validations";
import Link from "next/link";
import { useState } from "react";
import { ProductCartCard } from "../globals/cards";
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
    initialData: CachedCart[];
    user: CachedUser;
}

export function CheckoutPage({
    className,
    initialData,
    user,
    ...props
}: PageProps) {
    const [isAddressChangeModalOpen, setIsAddressChangeModalOpen] =
        useState(false);

    const { data: cart } = trpc.general.users.cart.getCart.useQuery(
        { userId: user.id },
        { initialData }
    );

    const [deliveryAddress, setDeliveryAddress] = useState<
        CachedUser["addresses"][number] | undefined
    >(user.addresses?.find((address) => address.isPrimary));

    const priceList = calculateTotalPrice(
        cart
            .filter((item) => item.status)
            .map((item) => parseFloat(item.product.price) * item.quantity)
    );

    return (
        <>
            <div
                className={cn(
                    "flex flex-col-reverse justify-between gap-5 lg:flex-row",
                    className
                )}
                {...props}
            >
                <div className="w-full space-y-5 p-5">
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

                    <div className="grid grid-cols-3 gap-5 md:grid-cols-6">
                        <div className="hidden font-semibold md:inline-block">
                            2.
                        </div>

                        <div className="font-semibold">Payment</div>

                        <div className="md:col-span-3">
                            <div className="text-sm text-muted-foreground">
                                No payment information found
                            </div>
                        </div>

                        <div className="flex items-start justify-end">
                            <button className="text-xs text-primary hover:underline md:text-sm">
                                Change
                            </button>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
                        <div className="hidden font-semibold md:inline-block">
                            3.
                        </div>
                        <div className="font-semibold">Review Items</div>
                    </div>

                    <div className="space-y-2">
                        {cart
                            .filter((item) => item.status)
                            .map((item) => (
                                <ProductCartCard
                                    item={item}
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
                            <Button size="sm" className="w-full">
                                Place Order
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
        </>
    );
}
