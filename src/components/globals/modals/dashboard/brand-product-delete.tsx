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
import { HomeBrandProduct } from "@/lib/validations";
import { parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    brandProduct: HomeBrandProduct;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function BrandProductDeleteModal({
    brandProduct,
    isOpen,
    setIsOpen,
}: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const { refetch } =
        trpc.general.content.homeBrandProducts.getHomeBrandProducts.useQuery({
            page,
            limit,
        });

    const { mutate: deleteBrandProduct, isPending: isDeleting } =
        trpc.general.content.homeBrandProducts.deleteHomeBrandProduct.useMutation(
            {
                onMutate: () => {
                    const toastId = toast.loading("Deleting brand product...");
                    return { toastId };
                },
                onSuccess: (_, __, { toastId }) => {
                    toast.success("Brand product deleted", { id: toastId });
                    setIsOpen(false);
                    refetch();
                },
                onError: (err, _, ctx) => {
                    return handleClientError(err, ctx?.toastId);
                },
            }
        );

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to delete this brand product?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this brand product will remove it from the
                        platform. This action cannot be undone.
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
                            deleteBrandProduct({ id: brandProduct.id })
                        }
                    >
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
