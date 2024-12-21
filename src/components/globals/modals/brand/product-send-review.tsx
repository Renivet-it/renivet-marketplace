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
    isResend?: boolean;
}

export function ProductSendReviewModal({
    product,
    isOpen,
    setIsOpen,
    isResend = false,
}: PageProps) {
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

    const { mutate: sendForReview, isPending: isSending } =
        trpc.brands.products.sendProductForReview.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    isResend
                        ? "Resending product for review..."
                        : "Sending product for review..."
                );
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success(
                    isResend
                        ? "Product resent for review successfully"
                        : "Product sent for review successfully",
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
                        Are you sure you want to {isResend ? "resend" : "send"}{" "}
                        this product for review?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        While the product is under review, you will not be able
                        to make any changes to it.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSending}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        size="sm"
                        disabled={isSending}
                        onClick={() =>
                            sendForReview({
                                productId: product.id,
                            })
                        }
                    >
                        {isResend ? "Resend" : "Send"} for review
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
