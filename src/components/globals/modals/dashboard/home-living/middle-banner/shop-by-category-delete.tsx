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
import { HomeShopByCategory } from "@/lib/validations";
import { parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    shopByCategory: HomeShopByCategory;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function ShopByCategoryDeleteModal({
    shopByCategory,
    isOpen,
    setIsOpen,
}: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const { refetch } =
        trpc.general.content.homeAndLivingBannerMiddlecollectionRouter.getwomenHomeBanners.useQuery(
            {
                page,
                limit,
            }
        );

    const { mutate: deleteShopByCategory, isPending: isDeleting } =
        trpc.general.content.homeAndLivingBannerMiddlecollectionRouter.deleteWomenBanner.useMutation(
            {
                onMutate: () => {
                    const toastId = toast.loading("Deleting shop by category");
                    return { toastId };
                },
                onSuccess: (_, __, { toastId }) => {
                    toast.success("Shop by category deleted", { id: toastId });
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
                        Are you sure you want to delete this banner?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this banner will remove it from the
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
                            deleteShopByCategory({ id: shopByCategory.id })
                        }
                    >
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
