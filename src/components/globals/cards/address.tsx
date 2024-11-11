"use client";

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn, convertValueToLabel, generateAddress } from "@/lib/utils";
import { CachedUser } from "@/lib/validations";
import { Dispatch, SetStateAction, useState } from "react";
import { UserAddressDeleteModal } from "../modals/profile";

interface PageProps extends GenericProps {
    address: CachedUser["addresses"][0];
    setFormOpen: Dispatch<SetStateAction<boolean>>;
    setSelectedAddress: Dispatch<
        SetStateAction<CachedUser["addresses"][0] | undefined>
    >;
}

export function AddressCard({
    className,
    setFormOpen,
    setSelectedAddress,
    address,
    ...props
}: PageProps) {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    return (
        <>
            <Card
                className={cn(
                    "flex h-full flex-col justify-between rounded-none",
                    className
                )}
                key={address.id}
                {...props}
            >
                <div>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            {convertValueToLabel(address.type)}{" "}
                            {address.alias && (
                                <span className="text-muted-foreground">
                                    ({address.alias})
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-2">
                        <p className="text-sm">
                            To,{" "}
                            <span className="font-semibold">
                                {address.fullName}
                            </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {generateAddress(address)}
                        </p>
                    </CardContent>
                </div>

                <CardFooter className="flex justify-between gap-2">
                    <Badge
                        variant={address.isPrimary ? "secondary" : "default"}
                        className="rounded-none"
                    >
                        {address.isPrimary ? "Primary" : "Not Primary"}
                    </Badge>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setSelectedAddress(address);
                                setFormOpen(true);
                            }}
                        >
                            <Icons.Pencil className="size-4" />
                            <span className="sr-only">Edit</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            disabled={address.isPrimary}
                            onClick={() => setIsDeleteModalOpen(true)}
                        >
                            <Icons.Trash2 className="size-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            <UserAddressDeleteModal
                address={address}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />
        </>
    );
}
