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
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    product: TableProduct;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function ProductPublishModal({ product, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

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
        trpc.brands.products.updateProduct.useMutation({
            onMutate: ({ values }) => {
                const toastId = toast.loading(
                    !values.isPublished
                        ? "Unpublishing product..."
                        : "Publishing product..."
                );
                return { toastId };
            },
            onSuccess: (_, { values }, { toastId }) => {
                toast.success(
                    !values.isPublished
                        ? "Product is now private"
                        : "Product is now public",
                    {
                        id: toastId,
                    }
                );
                refetch();
                setIsOpen(false);
                router.refresh();
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
                        {product.isPublished ? "unpublish" : "publish"} this
                        product?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {product.isPublished
                            ? "People will no longer be able to see or purchase this product. Are you sure you want to unpublish it?"
                            : "People will be able to see and purchase this product. Are you sure you want to publish it?"}
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
                                values: {
                                    ...product,
                                    isPublished: !product.isPublished,
                                },
                            })
                        }
                    >
                        {product.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
