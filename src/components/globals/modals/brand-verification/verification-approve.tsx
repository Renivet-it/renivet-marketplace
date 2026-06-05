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
import { BrandConfidentialWithBrand } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    data: BrandConfidentialWithBrand;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function VerificationApproveModal({
    data,
    isOpen,
    setIsOpen,
}: PageProps) {
    const router = useRouter();

    const { mutate: approveVerification, isPending: isApproving } =
        trpc.general.brands.verifications.approveVerification.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    "Approving brand verification..."
                );
                return { toastId };
            },
            onSuccess: async (_, __, { toastId }) => {
                toast.success("Brand verification approved successfully.", {
                    id: toastId,
                });
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
                        Are you sure you want to approve this brand verification
                        request?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will mark the brand verification as approved
                        and remove it from the pending verification queue.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isApproving}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isApproving}
                        onClick={() =>
                            approveVerification({
                                id: data.id,
                            })
                        }
                    >
                        Approve Verification
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
