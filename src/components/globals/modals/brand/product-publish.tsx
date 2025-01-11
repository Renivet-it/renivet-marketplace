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

export function ProductPublishModal({ product, isOpen, setIsOpen }: PageProps) {
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
        trpc.brands.products.updateProductPublishStatus.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Publishing product...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product is now published on the marketplace", {
                    id: toastId,
                });
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
                        Are you sure you want to publish this product?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        People will be able to see and purchase this product.
                        Are you sure you want to publish it?
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
                                isPublished: true,
                            })
                        }
                    >
                        Publish
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
