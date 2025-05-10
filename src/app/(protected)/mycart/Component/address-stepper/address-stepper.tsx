"use client";

import { Badge } from "@/components/ui/badge";
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
    DialogTrigger,
} from "@/components/ui/dialog-dash";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore } from "@/lib/store/cart-store";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Loader2, Phone, Trash2, Edit, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AddAddressForm from "../add-address";
import { AddressManageForm } from "@/components/globals/forms";

export default function ShippingAddress({ className, ...props }: GenericProps) {
    const { data: user, isLoading, refetch } = trpc.general.users.currentUser.useQuery();
    const addresses = useMemo(() => user?.addresses ?? [], [user?.addresses]);
    const [addFormOpen, setAddFormOpen] = useState(false);
    const [editFormOpen, setEditFormOpen] = useState(false);
    const [editAddress, setEditAddress] = useState(null);
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

    const { mutate: deleteAddress, isPending: isDeleting } =
        trpc.general.users.deleteAddress.useMutation({
            onSuccess: () => {
                refetch();
                setSelectedAddressId("");
            },
        });

    const handleDelete = (addressId: string) => {
        deleteAddress({ userId: user?.id, addressId });
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
                                            onSuccess={() => {
                                                setAddFormOpen(false);
                                            }}
                                            onCancel={() => setAddFormOpen(false)}
                                        />
                                    )}
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : (
                        <div className="space-y-2 mt-2">
                            <RadioGroup
                                defaultValue={selectedAddressId}
                                onValueChange={(value) =>
                                    setSelectedAddressId(value)
                                }
                                className="space-y-2"
                            >
                                {addresses.map((address) => {
                                    const isSelected = address.id === selectedAddressId;
                                    return (
                                        <div
                                            key={address.id}
                                            className="flex items-start space-x-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50"
                                        >
                                            <RadioGroupItem
                                                value={address.id}
                                                className="mt-1 size-4"
                                            />

                                            <div className="flex-1">
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
                                                    <Phone
                                                        className="mr-1 text-gray-600"
                                                        size={14}
                                                    />
                                                    {address.phone}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    className="text-sm text-blue-600 hover:underline flex items-center"
                                                    onClick={() => {
                                                        setEditAddress(address);
                                                        setEditFormOpen(true);
                                                    }}
                                                >
                                                    <Edit className="size-4 mr-1" />
                                                    Edit
                                                </button>
                                                <button
                                                    className="text-sm text-red-600 hover:underline flex items-center"
                                                    onClick={() => handleDelete(address.id)}
                                                    disabled={isDeleting}
                                                >
                                                    <Trash2 className="size-4 mr-1" />
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
                                <DialogContent className="sm:max-w-[800px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-lg font-semibold text-gray-900">
                                            Add New Address
                                        </DialogTitle>
                                    </DialogHeader>

                                    {user?.id && (
                                        <AddAddressForm
                                            user={user}
                                            onSuccess={() => {
                                                setAddFormOpen(false);
                                            }}
                                            onCancel={() => setAddFormOpen(false)}
                                        />
                                    )}
                                </DialogContent>
                            </Dialog>

                            <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
                                <DialogContent className="sm:max-w-[800px]">
                                    <Card className="rounded-none">
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
                                                setSelectedAddress={(address) => {
                                                    setSelectedAddressId(address.id);
                                                    setEditFormOpen(false);
                                                    setEditAddress(null);
                                                }}
                                            />
                                        )}
                                    </Card>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </CardHeader>
            </Card>
        </>
    );
}