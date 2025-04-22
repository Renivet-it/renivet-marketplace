"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import {
    Card,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog-dash";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Loader2, Phone, Trash2, Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AddAddressForm from "../add-address";
import { AddressManageForm } from "./address-manage-form";
import { UserAddressDeleteModal } from "@/components/globals/modals";

interface GenericProps {
    className?: string;
    [key: string]: any;
}

interface Address {
    id: string;
    phone: string;
    type: "home" | "work" | "other";
    alias: string;
    aliasSlug: string;
    fullName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    isPrimary: boolean;
}

export default function ShippingAddress({ className, ...props }: GenericProps) {
    const router = useRouter();
    const { data: user, isLoading } = trpc.general.users.currentUser.useQuery();
    const addresses = useMemo(() => user?.addresses ?? [], [user?.addresses]);
    const [addFormOpen, setAddFormOpen] = useState(false);
    const [editFormOpen, setEditFormOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteAddress, setDeleteAddress] = useState<Address | null>(null);
    const [editAddress, setEditAddress] = useState<Address | null>(null);
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

    const handleProceed = () => {
        if (!selectedAddressId) {
            toast.error("Please select a shipping address.");
            return;
        }
        router.push("?step=2");
    };

    return (
        <>
            <Card className={cn("border border-gray-200 shadow-none rounded-md", className)} {...props}>
                <CardHeader className="p-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                        Shipping Address
                    </CardTitle>
                    {isLoading ? (
                        <div className="flex h-24 items-center justify-center text-gray-600 text-sm">
                            <Loader2 className="mr-2 animate-spin size-4" />
                            Loading addresses...
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="space-y-2 mt-2">
                            <div className="text-sm text-gray-600">
                                You have no saved addresses. Please add one to proceed with checkout.
                            </div>
                            <Dialog open={addFormOpen} onOpenChange={setAddFormOpen}>
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
                                        <DialogTitle className="text-lg font-semibold text-gray-900">
                                            Add New Address
                                        </DialogTitle>
                                    </DialogHeader>
                                    {user?.id && (
                                        <AddAddressForm
                                            user={user}
                                            onSuccess={() => setAddFormOpen(false)}
                                            onCancel={() => setAddFormOpen(false)}
                                        />
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : (
                        <div className="space-y-2 mt-2">
                            <RadioGroup
                                value={selectedAddressId || ""}
                                onValueChange={(value) => setSelectedAddressId(value)}
                                className="space-y-2"
                            >
                                {addresses.map((address) => {
                                    const isSelected = address.id === selectedAddressId;
                                    const isOnlyPrimary = address.isPrimary;
                                    return (
                                        <div
                                            key={address.id}
                                            className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <RadioGroupItem
                                                    value={address.id}
                                                    className="mt-1 size-4"
                                                    checked={isSelected}
                                                />
                                                <div className="w-full sm:w-auto flex-1 sm:flex-none">
                                                    <div className="flex items-center gap-1 text-base font-semibold text-gray-900">
                                                        {address.fullName}
                                                        {address.isPrimary && (
                                                            <Badge
                                                                variant="default"
                                                                className="ml-2 bg-blue-100 text-blue-800 text-xs"
                                                            >
                                                                Primary
                                                            </Badge>
                                                        )}
                                                        {isSelected && (
                                                            <Badge
                                                                variant="default"
                                                                className="ml-2 bg-green-100 text-green-800 text-xs"
                                                            >
                                                                Selected
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {address.street}, {address.city}, {address.state} - {address.zip}
                                                    </div>
                                                    <div className="text-sm text-gray-600 flex items-center">
                                                        <Phone className="mr-1 text-gray-600" size={14} />
                                                        {address.phone}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-row items-center gap-1 sm:gap-3 sm:ml-auto sm:pl-4">
                                                <button
                                                    className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center p-1 sm:p-0"
                                                    onClick={() => {
                                                        setEditAddress(address);
                                                        setEditFormOpen(true);
                                                    }}
                                                >
                                                    <Edit className="size-3 sm:size-4 mr-1" />
                                                    Edit
                                                </button>
                                                <button
                                                    className={cn(
                                                        "text-xs sm:text-sm text-red-600 hover:underline flex items-center p-1 sm:p-0",
                                                        isOnlyPrimary && "opacity-50 cursor-not-allowed"
                                                    )}
                                                    onClick={() => {
                                                        if (!isOnlyPrimary) {
                                                            setDeleteAddress(address);
                                                            setIsDeleteModalOpen(true);
                                                        }
                                                    }}
                                                    disabled={isOnlyPrimary}
                                                >
                                                    <Trash2 className="size-3 sm:size-4 mr-1" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </RadioGroup>
                            <Dialog open={addFormOpen} onOpenChange={setAddFormOpen}>
                                <DialogTrigger asChild>
                                    <div className="flex items-center gap-2 border border-dashed border-gray-300 rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                                        <Plus className="size-4 text-blue-600" />
                                        <span className="text-sm text-blue-600">
                                            Add a new address
                                        </span>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle className="text-lg font-semibold text-gray-900">
                                            Add New Address
                                        </DialogTitle>
                                    </DialogHeader>
                                    {user?.id && (
                                        <AddAddressForm
                                            user={user}
                                            onSuccess={() => setAddFormOpen(false)}
                                            onCancel={() => setAddFormOpen(false)}
                                        />
                                    )}
                                </DialogContent>
                            </Dialog>
                            <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
                                <DialogContent className="sm:max-w-lg">
                                        <CardHeader>
                                            <CardTitle>
                                                {editAddress ? "Edit Address" : "Add New Address"}
                                            </CardTitle>
                                        </CardHeader>
                                        {user?.id && editAddress && (
                                            <AddressManageForm
                                                user={user}
                                                setFormOpen={setEditFormOpen}
                                                key={editAddress?.id}
                                                address={editAddress}
                                                setSelectedAddress={(address: any) => {
                                                    setSelectedAddressId(address?.id);
                                                    setEditFormOpen(false);
                                                    setEditAddress(null);
                                                }}
                                            />
                                        )}
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </CardHeader>
            </Card>
            {deleteAddress && (
                <UserAddressDeleteModal
                    address={deleteAddress}
                    isOpen={isDeleteModalOpen}
                    setIsOpen={setIsDeleteModalOpen}
                />
            )}
        </>
    );
}