"use client";

import { UserAddressDeleteModal } from "@/components/globals/modals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-dash";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Edit, Loader2, Phone, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AddAddressForm from "../add-address";
import { AddressManageForm } from "./address-manage-form";

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

    const handleProceed = () => {
        if (!selectedAddressId) {
            toast.error("Please select a shipping address.");
            return;
        }
        router.push("?step=2");
    };

    return (
        <>
            <Card
                className={cn(
                    "rounded-xl border border-gray-200 shadow-none",
                    className
                )}
                {...props}
            >
                <CardHeader className="p-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                        Shipping Address
                    </CardTitle>
                    {isLoading ? (
                        <div className="flex h-24 items-center justify-center text-sm text-gray-600">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Loading addresses...
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="mt-2 space-y-2">
                            <div className="text-sm text-gray-600">
                                You have no saved addresses. Please add one to
                                proceed with checkout.
                            </div>
                            <Dialog
                                open={addFormOpen}
                                onOpenChange={setAddFormOpen}
                            >
                                <DialogTrigger asChild>
                                    <div className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#c5d1b8] p-3 hover:bg-[#f0f4eb]">
                                        <Plus className="size-4 text-[#6B7A5E]" />
                                        <span className="text-sm text-[#6B7A5E]">
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
                                            onSuccess={() =>
                                                setAddFormOpen(false)
                                            }
                                            onCancel={() =>
                                                setAddFormOpen(false)
                                            }
                                        />
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : (
                        <div className="mt-2 space-y-2">
                            <RadioGroup
                                value={selectedAddressId || ""}
                                onValueChange={(value) =>
                                    setSelectedAddressId(value)
                                }
                                className="space-y-2"
                            >
                                {addresses.map((address) => {
                                    const isSelected =
                                        address.id === selectedAddressId;
                                    const isOnlyPrimary = address.isPrimary;
                                    return (
                                        <div
                                            key={address.id}
                                            className="flex flex-col items-start space-y-2 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-[#fcfcf5] sm:flex-row sm:items-center sm:justify-between sm:space-x-3 sm:space-y-0"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <RadioGroupItem
                                                    value={address.id}
                                                    className="mt-1 size-4"
                                                    checked={isSelected}
                                                />
                                                <div className="w-full flex-1 sm:w-auto sm:flex-none">
                                                    <div className="flex items-center gap-1 text-base font-semibold text-gray-900">
                                                        {address.fullName}
                                                        {address.isPrimary && (
                                                            <Badge
                                                                variant="default"
                                                                className="ml-2 bg-[#f0f4eb] text-xs text-[#6B7A5E]"
                                                            >
                                                                Primary
                                                            </Badge>
                                                        )}
                                                        {isSelected && (
                                                            <Badge
                                                                variant="default"
                                                                className="ml-2 bg-[#e8f0dc] text-xs text-[#536845]"
                                                            >
                                                                Selected
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {address.street},{" "}
                                                        {address.city},{" "}
                                                        {address.state} -{" "}
                                                        {address.zip}
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Phone
                                                            className="mr-1 text-gray-600"
                                                            size={14}
                                                        />
                                                        {address.phone}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-row items-center gap-1 sm:ml-auto sm:gap-3 sm:pl-4">
                                                <button
                                                    className="flex items-center p-1 text-xs text-[#6B7A5E] hover:underline sm:p-0 sm:text-sm"
                                                    onClick={() => {
                                                        setEditAddress(address);
                                                        setEditFormOpen(true);
                                                    }}
                                                >
                                                    <Edit className="mr-1 size-3 sm:size-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    className={cn(
                                                        "flex items-center p-1 text-xs text-red-600 hover:underline sm:p-0 sm:text-sm",
                                                        isOnlyPrimary &&
                                                            "cursor-not-allowed opacity-50"
                                                    )}
                                                    onClick={() => {
                                                        if (!isOnlyPrimary) {
                                                            setDeleteAddress(
                                                                address
                                                            );
                                                            setIsDeleteModalOpen(
                                                                true
                                                            );
                                                        }
                                                    }}
                                                    disabled={isOnlyPrimary}
                                                >
                                                    <Trash2 className="mr-1 size-3 sm:size-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </RadioGroup>
                            <Dialog
                                open={addFormOpen}
                                onOpenChange={setAddFormOpen}
                            >
                                <DialogTrigger asChild>
                                    <div className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[#c5d1b8] p-3 hover:bg-[#f0f4eb]">
                                        <Plus className="size-4 text-[#6B7A5E]" />
                                        <span className="text-sm text-[#6B7A5E]">
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
                                            onSuccess={() =>
                                                setAddFormOpen(false)
                                            }
                                            onCancel={() =>
                                                setAddFormOpen(false)
                                            }
                                        />
                                    )}
                                </DialogContent>
                            </Dialog>
                            <Dialog
                                open={editFormOpen}
                                onOpenChange={setEditFormOpen}
                            >
                                <DialogContent className="sm:max-w-lg">
                                    <CardHeader>
                                        <CardTitle>
                                            {editAddress
                                                ? "Edit Address"
                                                : "Add New Address"}
                                        </CardTitle>
                                    </CardHeader>
                                    {user?.id && editAddress && (
                                        <AddressManageForm
                                            user={user}
                                            setFormOpen={setEditFormOpen}
                                            key={editAddress?.id}
                                            address={editAddress}
                                            setSelectedAddress={(
                                                address: any
                                            ) => {
                                                setSelectedAddressId(
                                                    address?.id
                                                );
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
