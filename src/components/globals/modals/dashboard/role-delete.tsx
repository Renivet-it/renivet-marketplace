"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-dash";
import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { CachedRole } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    role: CachedRole;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function RoleDeleteModal({ role, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const { refetch } = trpc.general.roles.getRoles.useQuery();

    const { mutate: deleteRole, isPending: isDeleting } =
        trpc.general.roles.deleteRole.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting role...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Role deleted", { id: toastId });
                setIsOpen(false);
                router.refresh();
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
                        Are you sure you want to delete this role?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this role will remove it from the platform.
                        This action cannot be undone. If this role is assigned
                        to any users, they will loose access to the role.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() =>
                            deleteRole({
                                id: role.id,
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
