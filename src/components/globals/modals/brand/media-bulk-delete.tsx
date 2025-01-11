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
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    mediaIds: string[];
    brandId: string;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    onComplete: () => void;
}

export function MediaBulkDeleteModal({
    mediaIds,
    brandId,
    isOpen,
    setIsOpen,
    onComplete,
}: PageProps) {
    const router = useRouter();

    const { mutate: deleteMedia, isPending: isDeleting } =
        trpc.brands.media.deleteMediaItems.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting media items...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Media items deleted", { id: toastId });
                setIsOpen(false);
                router.refresh();
                onComplete();
            },
            onError: (err, _, ctx) => {
                handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to bulk delete these media items?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting these media items will remove them from the
                        brand. Any links to these media items will be broken.
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
                            deleteMedia({
                                brandId,
                                ids: mediaIds,
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
