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
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    marketingStrip: MarketingStrip;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function MarketingStripDeleteModal({
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
    const [isActive] = useQueryState(
        "isActive",
        parseAsBoolean.withDefault(true)
    );

    const { refetch } =
        trpc.general.content.marketingStrips.getMarketingStrips.useQuery({
            page,
            limit,
            search,
            isActive,
        });

    const { mutate: deleteMarketingStrip, isPending: isDeleting } =
        trpc.general.content.marketingStrips.deleteMarketingStrip.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting item...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Item deleted", { id: toastId });
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
                        Are you sure you want to delete this item?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this item will remove it from the platform.
                        This action cannot be undone.
                        {marketingStrip.isActive && (
                            <>
                                <br />
                                <br />
                                <span>
                                    {" "}
                                    This item is currently active. Deleting this
                                    item will remove it from the marketing
                                    strip.
                                </span>
                            </>
                        )}
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
                            deleteMarketingStrip({ id: marketingStrip.id })
                        }
                    >
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
