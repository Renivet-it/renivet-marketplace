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
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Loader2, Phone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AddAddressForm from "./address-add-form";

export default function ShippingAddress({ className, ...props }: GenericProps) {
    const { data: user, isLoading } = trpc.general.users.currentUser.useQuery();
    const addresses = useMemo(() => user?.addresses ?? [], [user?.addresses]);
    const [formOpen, setFormOpen] = useState(false);

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

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className={cn("capitalize")}>
                        shipping address
                    </CardTitle>
                    <CardDescription className={cn("lowercase")}>
                        please select address for this order shipment
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-24 items-center justify-center text-muted-foreground">
                            <Loader2 className="mr-2 animate-spin" />
                            Loading addresses...
                        </div>
                    ) : addresses.length === 0 || !selectedAddress ? (
                        <div className="text-sm text-muted-foreground">
                            You have no saved addresses. Please add one to
                            proceed with checkout.
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start space-x-4 rounded-md border p-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 font-medium">
                                        {selectedAddress.fullName}
                                        <div className="flex-1"></div>
                                        <div className="flex items-center gap-2">
                                            {selectedAddress.isPrimary && (
                                                <Badge
                                                    variant="default"
                                                    className="bg-blue-500 text-white"
                                                >
                                                    Primary
                                                </Badge>
                                            )}
                                            <Badge
                                                variant="default"
                                                className="bg-green-600 text-white"
                                            >
                                                Selected
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="mt-1 text-sm text-muted-foreground">
                                        {selectedAddress.street},{" "}
                                        {selectedAddress.city},{" "}
                                        {selectedAddress.state} -{" "}
                                        {selectedAddress.zip}
                                    </div>

                                    <div className="mt-1 text-sm">
                                        <Phone
                                            className="mr-1 inline-block"
                                            size={14}
                                        />
                                        {selectedAddress.phone}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 space-y-4 sm:space-x-4 sm:space-y-0">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            Select Different Address
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                Select Address
                                            </DialogTitle>
                                            <DialogDescription>
                                                Choose a different address for
                                                this order.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <RadioGroup
                                            defaultValue={selectedAddressId}
                                            onValueChange={(value) =>
                                                setSelectedAddressId(value)
                                            }
                                        >
                                            {addresses.map((address) => {
                                                const isSelected =
                                                    address.id ===
                                                    selectedAddressId;
                                                return (
                                                    <div
                                                        key={address.id}
                                                        className="flex items-start space-x-4 rounded-md border p-4"
                                                    >
                                                        <RadioGroupItem
                                                            value={address.id}
                                                        />

                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 font-medium">
                                                                {
                                                                    address.fullName
                                                                }

                                                                {address.isPrimary && (
                                                                    <Badge
                                                                        variant="default"
                                                                        className="bg-blue-500"
                                                                    >
                                                                        Primary
                                                                    </Badge>
                                                                )}

                                                                {isSelected && (
                                                                    <Badge
                                                                        variant="default"
                                                                        className="bg-green-600"
                                                                    >
                                                                        Selected
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            <div className="text-sm text-muted-foreground">
                                                                {address.street}
                                                                , {address.city}
                                                                ,{" "}
                                                                {address.state}{" "}
                                                                - {address.zip}
                                                            </div>

                                                            <div className="text-sm">
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
                                    </DialogContent>
                                </Dialog>
                                <Dialog
                                    open={formOpen}
                                    onOpenChange={setFormOpen}
                                >
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
                                            />
                                        )}
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter></CardFooter>
            </Card>
        </>
    );
}
