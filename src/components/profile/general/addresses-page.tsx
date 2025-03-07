"use client";

import { AddressCard } from "@/components/globals/cards";
import { AddressManageForm } from "@/components/globals/forms";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Address } from "@/lib/validations";
import { motion } from "motion/react";
import { useState } from "react";

export function AddressesPage({ className, ...props }: GenericProps) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] =
        useState<Omit<Address, "createdAt" | "updatedAt">>();

    const { data: user } = trpc.general.users.currentUser.useQuery();
    if (!user) return null;

    return (
        <div className={cn("space-y-5", className)} {...props}>
            <Card className="w-full rounded-none">
                <CardHeader className="px-4 md:p-6">
                    <CardTitle>Addresses</CardTitle>
                    <CardDescription>
                        Manage your shipping and billing addresses
                    </CardDescription>
                </CardHeader>

                <Separator />

                <CardContent className="space-y-6 p-4 md:p-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {user.addresses
                            .sort(
                                (a, b) =>
                                    Number(b.isPrimary) - Number(a.isPrimary)
                            )
                            .map((address) => (
                                <AddressCard
                                    key={address.id}
                                    address={address}
                                    setFormOpen={setFormOpen}
                                    setSelectedAddress={setSelectedAddress}
                                />
                            ))}

                        <Card className="flex aspect-video h-full items-center justify-center rounded-none md:aspect-auto">
                            <Button
                                variant="ghost"
                                className="size-full text-base font-semibold"
                                onClick={() => {
                                    setFormOpen(true);
                                    setSelectedAddress(undefined);
                                }}
                            >
                                <Icons.Plus className="size-5" />
                                <span>Add New Address</span>
                            </Button>
                        </Card>
                    </div>

                    {isFormOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="rounded-none">
                                <CardHeader>
                                    <CardTitle>
                                        {selectedAddress
                                            ? "Edit Address"
                                            : "Add New Address"}
                                    </CardTitle>
                                </CardHeader>

                                <AddressManageForm
                                    user={user}
                                    setFormOpen={setFormOpen}
                                    key={selectedAddress?.id}
                                    address={selectedAddress}
                                    setSelectedAddress={setSelectedAddress}
                                />
                            </Card>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
