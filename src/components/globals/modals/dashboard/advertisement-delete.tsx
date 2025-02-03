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

export function AdvertisementDeleteModal({
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

    const { mutate: deleteAdvertisementStatus, isPending: isDeleting } =
        trpc.general.content.advertisements.deleteAdvertisement.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting advertisement...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Advertisement deleted", { id: toastId });
                setIsOpen(false);
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
                        Are you sure you want to delete this advertisement?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this advertisement will remove it from the
                        platform. This action cannot be undone.
                        {advertisement.isPublished && (
                            <>
                                <br />
                                <br />
                                <span>
                                    {" "}
                                    This advertisement is currently published.
                                    Deleting this advertisement will remove it
                                    from the home
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
                            deleteAdvertisementStatus({ id: advertisement.id })
                        }
                    >
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
