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

export function BlogPublishModal({ blog, isOpen, setIsOpen }: PageProps) {
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

    const { mutate: updatePublishStatus, isPending: isUpdating } =
        trpc.blogs.changePublishStatus.useMutation({
            onMutate: ({ isPublished }) => {
                const toastId = toast.loading(
                    !isPublished ? "Unpublishing blog..." : "Publishing blog..."
                );
                return { toastId };
            },
            onSuccess: (_, { isPublished }, { toastId }) => {
                toast.success(
                    !isPublished ? "Blog unpublished" : "Blog published",
                    {
                        id: toastId,
                    }
                );
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
                        Are you sure you want to{" "}
                        {blog.isPublished ? "unpublish" : "publish"} this blog?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {blog.isPublished
                            ? "This blog will no longer be visible to the public, are you sure you want to unpublish it?"
                            : "This blog will be visible to the public, are you sure you want to publish it?"}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() =>
                            updatePublishStatus({
                                id: blog.id,
                                isPublished: !blog.isPublished,
                            })
                        }
                    >
                        {blog.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
