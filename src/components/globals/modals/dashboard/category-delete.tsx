"use client";

import { TableCategory } from "@/components/dashboard/general/categories";
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
    category: TableCategory;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function CategoryDeleteModal({
    category,
    isOpen,
    setIsOpen,
}: PageProps) {
    const router = useRouter();

    const { refetch } = trpc.general.categories.getCategories.useQuery();

    const { mutate: deleteCategory, isPending: isDeleting } =
        trpc.general.categories.deleteCategory.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting category...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Category deleted", { id: toastId });
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
                        Are you sure you want to delete this category?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this category will remove it from the platform.
                        This action cannot be undone.{" "}
                        {category.subCategories > 0
                            ? `This category is also used in ${category.subCategories} sub-category(ies), removing this category will remove associated sub-categories.`
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
                            deleteCategory({
                                id: category.id,
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
