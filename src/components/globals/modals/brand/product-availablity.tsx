"use client";

import { TableProduct } from "@/components/dashboard/brands/products";
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
import { parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    product: TableProduct;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function ProductAvailablityModal({
    product,
    isOpen,
    setIsOpen,
}: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const { refetch } = trpc.brands.products.getProducts.useQuery({
        brandIds: [product.brandId],
        limit,
        page,
        search,
    });

    const { mutate: updateProduct, isPending: isUpdating } =
        trpc.brands.products.updateProductAvailability.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    "Updating product availability..."
                );
                return { toastId };
            },
            onSuccess: (_, { isAvailable }, { toastId }) => {
                toast.success(
                    !isAvailable
                        ? "Product is now marked as unavailable"
                        : "Product is now marked as available",
                    { id: toastId }
                );
                refetch();
                setIsOpen(false);
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
                        Are you sure you want to mark this product as{" "}
                        {product.isAvailable ? "unavailable" : "available"}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {product.isAvailable
                            ? "People will no longer be able to purchase this product. Are you sure you want to mark it as unavailable?"
                            : "People will be able to purchase this product. Are you sure you want to mark it as available?"}
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
                            updateProduct({
                                productId: product.id,
                                isAvailable: !product.isAvailable,
                            })
                        }
                    >
                        {product.isAvailable
                            ? "Mark as unavailable"
                            : "Mark as available"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
