"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
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
import { Loader2, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AddAddressForm from "./add-address";

export default function ShippingAddress({ className, ...props }: GenericProps) {
    const { data: user, isLoading } = trpc.general.users.currentUser.useQuery();
    const addresses = useMemo(() => user?.addresses ?? [], [user?.addresses]);
    const [formOpen, setFormOpen] = useState(false);
    const setSelectedShippingAddress = useCartStore(
        (state) => state.setSelectedShippingAddress
    );

    const primaryAddress = addresses.find((addr) => addr.isPrimary);
    const [selectedAddressId, setSelectedAddressId] = useState("");

    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            setSelectedAddressId(primaryAddress?.id ?? "");
        }
    }, [addresses, primaryAddress, selectedAddressId]);

    const selectedAddress = addresses.find(
        (addr) => addr.id === selectedAddressId
    );

    useEffect(() => {
        if (selectedAddress) {
            setSelectedShippingAddress(selectedAddress);
        }
    }, [selectedAddress, setSelectedShippingAddress]);

    return (
        <>
            <Card className={cn("border border-gray-200 shadow-none", className)} {...props}>
                <CardHeader className="p-2">
                    {isLoading ? (
                        <div className="flex h-24 items-center justify-center text-muted-foreground">
                            <Loader2 className="mr-2 animate-spin" />
                            Loading addresses...
                        </div>
                    ) : addresses.length === 0 || !selectedAddress ? (
                        <>
                            <div className="mb-2 text-sm text-muted-foreground">
                                You have no saved addresses. Please add one to
                                proceed with checkout.
                            </div>
                            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                                <DialogTrigger asChild>
                                    <span className="cursor-pointer text-sm font-medium text-blue-600 hover:underline">
                                        Add New Address
                                    </span>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[800px]">
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
                        </>
                    ) : (
                        <div className="rounded-md p-2">
                            <div className="text-sm text-gray-500 mb-1">
                                Deliver to
                            </div>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-1 font-semibold text-base">
                                        {selectedAddress.fullName}
                                        {selectedAddress.isPrimary && (
                                            <Badge
                                                variant="default"
                                                className="bg-blue-500 text-white text-xs ml-2"
                                            >
                                                Primary
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="mt-1 text-sm text-gray-600">
                                        {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zip}
                                    </div>

                                    <div className="mt-1 text-sm text-gray-600">
                                        <Phone
                                            className="mr-1 inline-block"
                                            size={14}
                                        />
                                        {selectedAddress.phone}
                                    </div>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="rounded-sm border border-blue-500 px-4 py-1 text-xs font-semibold text-blue-500 hover:bg-blue-100">
                                            Change
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px]">
                                        <DialogHeader>
                                            <DialogTitle className="text-lg">
                                                Select Address
                                            </DialogTitle>
                                            <DialogDescription className="text-sm">
                                                Choose a different address for this order.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <RadioGroup
                                            defaultValue={selectedAddressId}
                                            onValueChange={(value) =>
                                                setSelectedAddressId(value)
                                            }
                                            className="space-y-2"
                                        >
                                            {addresses.map((address) => {
                                                const isSelected =
                                                    address.id === selectedAddressId;
                                                return (
                                                    <div
                                                        key={address.id}
                                                        className="flex items-start space-x-3 rounded-md border p-3 hover:bg-gray-50"
                                                    >
                                                        <RadioGroupItem
                                                            value={address.id}
                                                            className="mt-1"
                                                        />

                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-1 text-base font-semibold">
                                                                {address.fullName}
                                                                {address.isPrimary && (
                                                                    <Badge
                                                                        variant="default"
                                                                        className="ml-2 bg-blue-500 text-xs text-white"
                                                                    >
                                                                        Primary
                                                                    </Badge>
                                                                )}
                                                                {isSelected && (
                                                                    <Badge
                                                                        variant="default"
                                                                        className="ml-2 bg-green-600 text-xs text-white"
                                                                    >
                                                                        Selected
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div className="text-sm text-gray-600">
                                                                {address.street}, {address.city}, {address.state} - {address.zip}
                                                            </div>

                                                            <div className="text-sm text-gray-600">
                                                                <Phone
                                                                    className="mr-1 inline-block"
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
                                            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                                                <DialogTrigger asChild>
                                                    <span className="cursor-pointer text-sm font-medium text-blue-600 hover:underline">
                                                        + Add New Address
                                                    </span>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[800px]">
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
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardFooter className="p-2"></CardFooter>
            </Card>
        </>
    );
}