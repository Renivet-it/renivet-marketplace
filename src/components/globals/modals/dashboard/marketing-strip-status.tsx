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
import { MarketingStrip } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    marketingStrip: MarketingStrip;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function MarketingStripStatusModal({
    marketingStrip,
    isOpen,
    setIsOpen,
}: PageProps) {
    const router = useRouter();

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const { refetch } = trpc.general.content.banners.getBanners.useQuery({
        page,
        limit,
        search,
    });

    const { mutate: updateMarketingStripStatus, isPending: isUpdating } =
        trpc.general.content.marketingStrips.changeStatus.useMutation({
            onMutate: ({ isActive }) => {
                const toastId = toast.loading(
                    !isActive ? "Deactivating item..." : "Activating item..."
                );
                return { toastId };
            },
            onSuccess: (_, { isActive }, { toastId }) => {
                toast.success(
                    !isActive ? "Item deactivated" : "Item activated",
                    {
                        id: toastId,
                    }
                );
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
                        Are you sure you want to{" "}
                        {marketingStrip.isActive ? "deactivate" : "activate"}{" "}
                        this item?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {marketingStrip.isActive
                            ? "Deactivating this item will remove it from the marketing strip."
                            : "Activating this item will add it to the marketing strip."}
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
                            updateMarketingStripStatus({
                                id: marketingStrip.id,
                                isActive: !marketingStrip.isActive,
                            })
                        }
                    >
                        {marketingStrip.isActive ? "Deactivate" : "Activate"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
