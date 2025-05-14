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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog-dash";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Loader2, Phone, Plus } from "lucide-react";
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
    const { selectedShippingAddress, setSelectedShippingAddress } = useCartStore();
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
        selectedShippingAddress?.id || null
    );

    useEffect(() => {
        if (addresses.length > 0) {
            if (selectedShippingAddress?.id) {
                const isValidAddress = addresses.some((addr) => addr.id === selectedShippingAddress.id);
                if (isValidAddress) {
                    setSelectedAddressId(selectedShippingAddress.id);
                } else {
                    // @ts-ignore
                    setSelectedShippingAddress(null);
                    setSelectedAddressId(addresses.find((addr) => addr.isPrimary)?.id || addresses[0].id);
                }
            } else {
                setSelectedAddressId(addresses.find((addr) => addr.isPrimary)?.id || addresses[0].id);
            }
        }
    }, [addresses, selectedShippingAddress, setSelectedShippingAddress]);

    const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);

    useEffect(() => {
        if (selectedAddress) {
            setSelectedShippingAddress(selectedAddress);
        }
    }, [selectedAddress, setSelectedShippingAddress]);

    return (
        <Card className={cn("border border-gray-200 shadow-none", className)} {...props}>
            <CardHeader className="p-2">
                {isLoading ? (
                    <div className="flex h-24 items-center justify-center text-muted-foreground">
                        <Loader2 className="mr-2 animate-spin" />
                        Loading addresses...
                    </div>
                ) : addresses.length === 0 || !selectedAddress ? (
                    <>
                        <div className="space-y-2 mt-2">
                            <div className="text-sm text-gray-600">
                                You have no saved addresses. Please add one to proceed with checkout.
                            </div>
                        <Dialog open={formOpen} onOpenChange={setFormOpen}>
                                <DialogTrigger asChild>
                                    <div className="flex items-center gap-2 border border-dashed border-gray-300 rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                                        <Plus className="size-4 text-blue-600" />
                                        <span className="text-sm text-blue-600">
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
                    </>
                ) : (
                    <div className="rounded-md p-2">
                        <div className="text-sm text-gray-500 mb-1">Deliver to</div>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-1 font-semibold text-base">
                                    {selectedAddress.fullName}
                                    {selectedAddress.isPrimary && (
                                        <Badge variant="default" className="bg-blue-500 text-white text-xs ml-2">
                                            Primary
                                        </Badge>
                                    )}
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zip}
                                </div>
                                <div className="mt-1 text-sm text-gray-600">
                                    <Phone className="mr-1 inline-block" size={14} />
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
                                        <DialogTitle className="text-lg">Select Address</DialogTitle>
                                        <DialogDescription className="text-sm">
                                            Choose a different address for this order.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <RadioGroup
                                        value={selectedAddressId || ""}
                                        onValueChange={(value) => setSelectedAddressId(value)}
                                        className="space-y-2"
                                    >
                                        {addresses.map((address) => {
                                            const isSelected = address.id === selectedAddressId;
                                            return (
                                                <div
                                                    key={address.id}
                                                    className="flex items-start space-x-3 rounded-md border p-3 hover:bg-gray-50"
                                                >
                                                    <RadioGroupItem value={address.id} className="mt-1" />
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
                                                            <Phone className="mr-1 inline-block" size={14} />
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
                                            <DialogContent className="sm:max-w-lg">
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
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardFooter className="p-2"></CardFooter>
        </Card>
    );
}