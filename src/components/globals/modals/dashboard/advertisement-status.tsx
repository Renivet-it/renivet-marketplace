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
import { Advertisement } from "@/lib/validations";
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    advertisement: Advertisement;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function AdvertisementStatusModal({
    advertisement,
    isOpen,
    setIsOpen,
}: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });
    const [isPublished] = useQueryState(
        "isPublished",
        parseAsBoolean.withDefault(true)
    );

    const { refetch } =
        trpc.general.content.advertisements.getAdvertisements.useQuery({
            page,
            limit,
            search,
            isPublished,
        });

    const { mutate: updateAdvertisementStatus, isPending: isUpdating } =
        trpc.general.content.advertisements.changeAdvertisementStatus.useMutation(
            {
                onMutate: ({ isPublished }) => {
                    const toastId = toast.loading(
                        !isPublished
                            ? "Unpublishing advertisement..."
                            : "Publishing advertisement..."
                    );
                    return { toastId };
                },
                onSuccess: (_, { isPublished }, { toastId }) => {
                    toast.success(
                        !isPublished
                            ? "Advertisement unpublished"
                            : "Advertisement published",
                        { id: toastId }
                    );
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
                        Are you sure you want to{" "}
                        {advertisement.isPublished ? "unpublish" : "publish"}{" "}
                        this advertisement?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {advertisement.isPublished
                            ? "This will remove the advertisement from the platform."
                            : "This will make the advertisement visible on the platform."}
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
                            updateAdvertisementStatus({
                                id: advertisement.id,
                                isPublished: !advertisement.isPublished,
                            })
                        }
                    >
                        {advertisement.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
