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
import { Banner } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    banner: Banner;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function BannerStatusModal({ banner, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const { refetch } = trpc.content.banners.getBanners.useQuery({
        page,
        limit,
    });

    const { mutate: updateBannerStatus, isPending: isUpdating } =
        trpc.content.banners.changeStatus.useMutation({
            onMutate: ({ isActive }) => {
                const toastId = toast.loading(
                    !isActive
                        ? "Deactivating banner..."
                        : "Activating banner..."
                );
                return { toastId };
            },
            onSuccess: (_, { isActive }, { toastId }) => {
                toast.success(
                    !isActive ? "Banner deactivated" : "Banner activated",
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
                        {banner.isActive ? "deactivate" : "activate"} this
                        banner?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {banner.isActive
                            ? "Deactivating this banner will remove it from the home carousels."
                            : "Activating this banner will add it to the home carousels."}
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
                            updateBannerStatus({
                                id: banner.id,
                                isActive: !banner.isActive,
                            })
                        }
                    >
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
