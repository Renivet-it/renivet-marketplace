"use client";

import { Icons } from "@/components/icons";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog-dash";
import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TableInvite } from "./invites-table";

interface PageProps {
    invite: TableInvite;
}

export function InviteAction({ invite }: PageProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const { refetch } = trpc.brands.invites.getInvites.useQuery({
        brandId: invite.brandId,
    });

    const { mutate: deleteInvite, isPending: isDeleting } =
        trpc.brands.invites.deleteInvite.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting invite...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Invite deleted", { id: toastId });
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
            <AlertDialogTrigger asChild>
                <Button
                    title="Delete invite"
                    variant="ghost"
                    className="size-8 p-0"
                    onClick={() => setIsOpen(true)}
                >
                    <span className="sr-only">Delete Invite</span>
                    <Icons.Trash className="size-4" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to delete this invite?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this invite will remove it from the platform.
                        This action cannot be undone. No one will be able to
                        join the brand using this invite link anymore.
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
                            deleteInvite({
                                brandId: invite.brandId,
                                inviteId: invite.id,
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
