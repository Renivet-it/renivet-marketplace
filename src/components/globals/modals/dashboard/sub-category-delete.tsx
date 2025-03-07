"use client";

import { TableSubCategory } from "@/components/dashboard/general/sub-categories";
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
    subCategory: TableSubCategory;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function SubCategoryDeleteModal({
    subCategory,
    isOpen,
    setIsOpen,
}: PageProps) {
    const router = useRouter();

    const { refetch } = trpc.general.subCategories.getSubCategories.useQuery();

    const { mutate: deleteSubCategory, isPending: isDeleting } =
        trpc.general.subCategories.deleteSubCategory.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting sub-category...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Sub Category deleted", { id: toastId });
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
                        Are you sure you want to delete this sub-category?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this sub-category will remove it from the
                        platform. This action cannot be undone.{" "}
                        {subCategory.productTypes > 0
                            ? `This sub-category is also used in ${subCategory.productTypes} product type(s), removing this sub-category will remove associated product types.`
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
                            deleteSubCategory({
                                id: subCategory.id,
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
