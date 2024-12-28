"use client";

import { ProductRejectForm } from "@/components/globals/forms";
import { Button } from "@/components/ui/button-dash";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PageProps {
    product: ProductWithBrand;
}

export function ProductActionPage({ product }: PageProps) {
    const router = useRouter();

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

    return (
        <Tabs defaultValue="approve">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="approve">Approve</TabsTrigger>
                <TabsTrigger value="reject">Reject</TabsTrigger>
            </TabsList>

            <TabsContent value="approve" className="space-y-4 pt-2">
                <p className="text-sm font-semibold">
                    Approving this product will make it available for customers
                    to purchase. Are you sure you want to approve this product?
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
