"use client";

import { TableTag } from "@/components/dashboard/tags";
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
    tag: TableTag;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function TagDeleteModal({ tag, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const { refetch } = trpc.tags.getTags.useQuery();

    const { mutate: deleteTag, isPending: isDeleting } =
        trpc.tags.deleteTag.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting tag");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Tag deleted", { id: toastId });
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
                        Are you sure you want to delete this tag?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this tag will remove it from the platform. This
                        action cannot be undone.{" "}
                        {tag.blogs > 0
                            ? `This tag is also used in ${tag.blogs} blog(s), removing this tag will remove it from those blogs.`
                            : ""}
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
                            deleteTag({
                                id: tag.id,
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
