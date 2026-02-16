"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-dash";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Leaf, Loader2, MapPin, Phone, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AddAddressForm from "./add-address";

interface GenericProps {
    className?: string;
    [key: string]: any;
}

interface Address {
    id: string;
    phone: string;
    fullName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    isPrimary: boolean;
}

export default function ShippingAddress({ className, ...props }: GenericProps) {
    const { data: user, isLoading } = trpc.general.users.currentUser.useQuery();
    const addresses = useMemo(() => user?.addresses ?? [], [user?.addresses]);
    const [formOpen, setFormOpen] = useState(false);
    const { selectedShippingAddress, setSelectedShippingAddress } =
        useCartStore();
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
        selectedShippingAddress?.id || null
    );

    useEffect(() => {
        if (addresses.length > 0) {
            if (selectedShippingAddress?.id) {
                const isValidAddress = addresses.some(
                    (addr) => addr.id === selectedShippingAddress.id
                );
                if (isValidAddress) {
                    setSelectedAddressId(selectedShippingAddress.id);
                } else {
                    // @ts-ignore
                    setSelectedShippingAddress(null);
                    setSelectedAddressId(
                        addresses.find((addr) => addr.isPrimary)?.id ||
                            addresses[0].id
                    );
                }
            } else {
                setSelectedAddressId(
                    addresses.find((addr) => addr.isPrimary)?.id ||
                        addresses[0].id
                );
            }
        }
    }, [addresses, selectedShippingAddress, setSelectedShippingAddress]);

    const selectedAddress = addresses.find(
        (addr) => addr.id === selectedAddressId
    );

    useEffect(() => {
        if (selectedAddress) {
            setSelectedShippingAddress(selectedAddress);
        }
    }, [selectedAddress, setSelectedShippingAddress]);

    return (
        <div
            className={cn(
                "rounded-xl border border-gray-200 bg-white",
                className
            )}
            {...props}
        >
            <div className="p-4 md:p-5">
                <div className="mb-3 flex items-center gap-2">
                    <MapPin className="size-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900 md:text-base">
                        Delivery Address
                    </h3>
                </div>

                {isLoading ? (
                    <div className="flex h-20 items-center justify-center text-muted-foreground">
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        <span className="text-sm">Loading addresses...</span>
                    </div>
                ) : addresses.length === 0 || !selectedAddress ? (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500">
                            You have no saved addresses. Please add one to
                            proceed with checkout.
                        </p>
                        <Dialog open={formOpen} onOpenChange={setFormOpen}>
                            <DialogTrigger asChild>
                                <div className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gray-300 p-3 transition-colors hover:border-green-400 hover:bg-green-50/50">
                                    <Plus className="size-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-600">
                                        Add a new address
                                    </span>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[800px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Address</DialogTitle>
                                </DialogHeader>
                                {user?.id && (
                                    <AddAddressForm
                                        user={user}
                                        onSuccess={() => setFormOpen(false)}
                                        onCancel={() => setFormOpen(false)}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {selectedAddress.fullName}
                                    </span>
                                    {selectedAddress.isPrimary && (
                                        <Badge
                                            variant="default"
                                            className="bg-blue-100 text-[10px] text-blue-700 hover:bg-blue-100"
                                        >
                                            Primary
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm leading-relaxed text-gray-600">
                                    {selectedAddress.street},{" "}
                                    {selectedAddress.city},{" "}
                                    {selectedAddress.state} -{" "}
                                    {selectedAddress.zip}
                                </p>
                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Phone className="size-3.5" />
                                    <span>{selectedAddress.phone}</span>
                                </div>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="shrink-0 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline">
                                        Change
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-lg">
                                            Select Address
                                        </DialogTitle>
                                        <DialogDescription className="text-sm">
                                            Choose a different address for this
                                            order.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <RadioGroup
                                        value={selectedAddressId || ""}
                                        onValueChange={(value) =>
                                            setSelectedAddressId(value)
                                        }
                                        className="space-y-2"
                                    >
                                        {addresses.map((address) => {
                                            const isSelected =
                                                address.id ===
                                                selectedAddressId;
                                            return (
                                                <div
                                                    key={address.id}
                                                    className={cn(
                                                        "flex items-start space-x-3 rounded-lg border p-3 transition-colors hover:bg-gray-50",
                                                        isSelected &&
                                                            "border-green-400 bg-green-50/50"
                                                    )}
                                                >
                                                    <RadioGroupItem
                                                        value={address.id}
                                                        className="mt-1"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-1 text-sm font-semibold">
                                                            {address.fullName}
                                                            {address.isPrimary && (
                                                                <Badge
                                                                    variant="default"
                                                                    className="ml-2 bg-blue-100 text-[10px] text-blue-700 hover:bg-blue-100"
                                                                >
                                                                    Primary
                                                                </Badge>
                                                            )}
                                                            {isSelected && (
                                                                <Badge
                                                                    variant="default"
                                                                    className="ml-2 bg-green-100 text-[10px] text-green-700 hover:bg-green-100"
                                                                >
                                                                    Selected
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="mt-1 text-sm text-gray-600">
                                                            {address.street},{" "}
                                                            {address.city},{" "}
                                                            {address.state} -{" "}
                                                            {address.zip}
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                                                            <Phone
                                                                className="inline-block"
                                                                size={14}
                                                            />
                                                            {address.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                    <DialogFooter className="mt-4">
                                        <Dialog
                                            open={formOpen}
                                            onOpenChange={setFormOpen}
                                        >
                                            <DialogTrigger asChild>
                                                <span className="cursor-pointer text-sm font-medium text-green-600 hover:underline">
                                                    + Add New Address
                                                </span>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-lg">
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Add New Address
                                                    </DialogTitle>
                                                </DialogHeader>
                                                {user?.id && (
                                                    <AddAddressForm
                                                        user={user}
                                                        onSuccess={() =>
                                                            setFormOpen(false)
                                                        }
                                                        onCancel={() =>
                                                            setFormOpen(false)
                                                        }
                                                    />
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Carbon-neutral delivery badge */}
                        <div className="flex w-fit items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5">
                            <Leaf className="size-3.5 text-green-600" />
                            <span className="text-xs font-medium text-green-700">
                                Carbon-neutral delivery
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
