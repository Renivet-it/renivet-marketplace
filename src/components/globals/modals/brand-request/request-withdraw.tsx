"use client";

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-general";
import { Button } from "@/components/ui/button-general";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { BrandRequestWithoutConfidentials } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    brandRequest: BrandRequestWithoutConfidentials;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function RequestWithdrawModal({
    brandRequest,
    isOpen,
    setIsOpen,
}: PageProps) {
    const router = useRouter();

    const { mutate: withdrawRequest, isPending: isRequestWithdrawing } =
        trpc.general.brands.requests.deleteRequest.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Withdrawing brand request...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success(
                    "Brand request withdrawn, you can submit a new one",
                    {
                        id: toastId,
                    }
                );
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
                        Are you sure you want to withdraw your brand request?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Withdrawing your brand request will remove it from our
                        system. You can submit a new request later.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isRequestWithdrawing}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isRequestWithdrawing}
                        onClick={() =>
                            withdrawRequest({
                                id: brandRequest.id,
                            })
                        }
                    >
                        Withdraw
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
