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
import { handleClientError, wait } from "@/lib/utils";
import { Brand, BrandConfidential } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    data: BrandConfidential & { brand: Brand };
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
                    "Linking brand to Razorpay & approving verification..."
                );
                return { toastId };
            },
            onSuccess: async (_, __, { toastId }) => {
                toast.success(
                    "Brand linked to Razorpay, please complete the KYC as soon as possible, else brand will not be able to receive payments, redirecting...",
                    { id: toastId, duration: 3000 }
                );
                setIsOpen(false);
                router.refresh();
                await wait(3000);
                window.open(
                    "https://dashboard.razorpay.com/app/route/accounts",
                    "_blank"
                );
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
                        Are you sure you want to approve this verification
                        request and link this brand to Razorpay?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will link the brand to Razorpay. Remember to
                        complete the KYC as soon as possible, else brand will
                        not be able to receive payments.
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
                                ...data,
                                email: data.brand.email,
                                name: data.brand.name,
                                phone: data.brand.phone,
                                ownerId: data.brand.ownerId,
                            })
                        }
                    >
                        Link to Razorpay
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
