"use client";

import { TableMedia } from "@/components/dashboard/brands/media";
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
    media: TableMedia;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function MediaDeleteModal({ media, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const { mutate: deleteMedia, isPending: isDeleting } =
        trpc.brands.media.deleteMediaItems.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting media...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Media deleted", { id: toastId });
                router.refresh();
                setIsOpen(false);
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
                        Are you sure you want to delete this media?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this media will remove it from the brand. Any
                        links to this media will be broken.
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
                                brandId: media.brandId,
                                ids: [media.id],
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
