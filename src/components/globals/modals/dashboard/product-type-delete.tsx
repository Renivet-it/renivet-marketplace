"use client";

import { TableProductType } from "@/components/dashboard/general/product-types";
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
    productType: TableProductType;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function ProductTypeDeleteModal({
    productType,
    isOpen,
    setIsOpen,
}: PageProps) {
    const router = useRouter();

    const { refetch } = trpc.general.productTypes.getProductTypes.useQuery();

    const { mutate: deleteProductType, isPending: isDeleting } =
        trpc.general.productTypes.deleteProductType.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting product type...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product Type deleted", { id: toastId });
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
                        Are you sure you want to delete this product type?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this product type will remove it from the
                        platform. This action cannot be undone. Removing this
                        product type will remove associated products.
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
                            deleteProductType({
                                id: productType.id,
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
