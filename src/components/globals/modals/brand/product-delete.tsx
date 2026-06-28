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
import { useQueryClient } from "@tanstack/react-query";
interface PageProps {
    product: TableProduct;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function ProductDeleteModal({ product, isOpen, setIsOpen }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    trpc.brands.products.getProducts.useQuery({
        brandIds: [product.brandId],
        limit,
        page,
        search,
    });
    const queryClient = useQueryClient();
    const { mutate: deleteProduct, isPending: isDeleting } =
        trpc.brands.products.deleteProduct.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting product...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product deleted successfully", { id: toastId });
                // refetch();
                queryClient.invalidateQueries({
                    queryKey: [["brands", "products", "getProducts"]],
                });
                setIsOpen(false);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });
    const { mutate: hardDeleteProduct, isPending: isHardDeleting } =
        trpc.brands.products.hardDeleteProduct.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Hard deleting product...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product permanently deleted", { id: toastId });
                queryClient.invalidateQueries({
                    queryKey: [["brands", "products", "getProducts"]],
                });
                setIsOpen(false);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const isPending = isDeleting || isHardDeleting;

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you sure you want to delete this product?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        People will no longer be able to view or purchase this
                        product. This action cannot be undone.
                    </AlertDialogDescription>
                    <AlertDialogDescription>
                        Hard delete permanently removes the product record and
                        only works when the product has no order history.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                            deleteProduct({
                                productId: product.id,
                            })
                        }
                    >
                        Soft Delete
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={() =>
                            hardDeleteProduct({
                                productId: product.id,
                            })
                        }
                    >
                        Hard Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
