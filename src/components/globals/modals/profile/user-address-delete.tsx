"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-general";
import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { CachedUser } from "@/lib/validations";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    address: CachedUser["addresses"][0];
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function UserAddressDeleteModal({
    address,
    isOpen,
    setIsOpen,
}: PageProps) {
    const { refetch } = trpc.general.users.currentUser.useQuery();

    const { mutate: deleteAddress, isPending: isAddressDeleting } =
        trpc.general.users.addresses.deleteAddress.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting address...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Address deleted", { id: toastId });
                setIsOpen(false);
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to delete this address?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this address will remove it from your account.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isAddressDeleting}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isAddressDeleting}
                        onClick={() =>
                            deleteAddress({
                                id: address.id,
                            })
                        }
                    >
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
