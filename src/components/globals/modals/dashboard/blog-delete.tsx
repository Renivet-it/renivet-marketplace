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
import { BlogWithAuthorAndTagCount } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    blog: BlogWithAuthorAndTagCount;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function BlogDeleteModal({ blog, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });
    const [isPublished] = useQueryState(
        "isPublished",
        parseAsBoolean.withDefault(true)
    );

    const { refetch } = trpc.blogs.getBlogs.useQuery({
        page,
        limit,
        search,
        isPublished,
    });

    const { mutate: deleteBlog, isPending: isDeleting } =
        trpc.blogs.deleteBlog.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting blog...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Blog deleted", { id: toastId });
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
                        Are you sure you want to delete this blog?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this blog will remove it from the platform.
                        This action cannot be undone.
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
                        onClick={() => deleteBlog({ id: blog.id })}
                    >
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
