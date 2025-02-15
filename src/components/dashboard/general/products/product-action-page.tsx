"use client";

import { ProductRejectForm } from "@/components/globals/forms";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-dash";
import { Button } from "@/components/ui/button-dash";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface PageProps {
    product: ProductWithBrand;
}

export function ProductActionPage({ product }: PageProps) {
    const router = useRouter();

    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

    const { refetch } = trpc.brands.products.getProduct.useQuery(
        { productId: product.id },
        { initialData: product }
    );

    const { mutate: approveProduct, isPending: isApproving } =
        trpc.general.productReviews.approveProduct.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Approving product...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product approved successfully", {
                    id: toastId,
                });
                refetch();
                router.push("/dashboard/general/products");
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: rejectProduct, isPending: isRejecting } =
        trpc.general.productReviews.rejectProduct.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    "Rejecting and Removing product..."
                );
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product rejected", { id: toastId });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    if (product.verificationStatus === "approved")
        return (
            <>
                <div className="space-y-2">
                    <p className="text-sm">
                        Remove the product by listing if needed by clicking the
                        button below. This will unlist the product from the
                        marketplace and unverify the product.
                    </p>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isRejecting}
                        onClick={() => setIsRemoveModalOpen(true)}
                    >
                        Remove Product
                    </Button>
                </div>

                <AlertDialog
                    open={isRemoveModalOpen}
                    onOpenChange={setIsRemoveModalOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Are you sure you want to remove this product?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                Removing this product will unlist it from the
                                marketplace and unverify it. Are you sure you
                                want to remove this product?
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={isRejecting}
                                onClick={() => setIsRemoveModalOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={isRejecting}
                                onClick={() =>
                                    rejectProduct({ id: product.id })
                                }
                            >
                                Remove
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );

    return (
        <Tabs defaultValue="approve">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="approve">Approve</TabsTrigger>
                <TabsTrigger value="reject">Reject</TabsTrigger>
            </TabsList>

            <TabsContent value="approve" className="space-y-4 pt-2">
                <p className="text-sm font-semibold">
                    Approving this product will give brand access to list it on
                    the marketplace. Are you sure you want to approve this
                    product?
                </p>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isApproving}
                    onClick={() => approveProduct({ productId: product.id })}
                >
                    Approve
                </Button>
            </TabsContent>

            <TabsContent value="reject" className="pt-2">
                <ProductRejectForm product={product} />
            </TabsContent>
        </Tabs>
    );
}
