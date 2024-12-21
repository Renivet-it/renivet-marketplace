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
import { BrandRequest } from "@/lib/validations";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    request: BrandRequest;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function RequestRzpLinkModal({ request, isOpen, setIsOpen }: PageProps) {
    const router = useRouter();

    const { mutate: linkToRzp, isPending: isLinking } =
        trpc.general.brands.requests.linkRzpAccount.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Linking brand to Razorpay...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success(
                    "Brand linked to Razorpay, please complete the KYC and approve the request",
                    { id: toastId }
                );
                setIsOpen(false);
                router.refresh();
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
                        Are you sure you want to link this brand to Razorpay?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will link the brand to Razorpay. Once
                        linked, the request cannot be rejected anymore.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isLinking}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isLinking}
                        onClick={() => linkToRzp(request)}
                    >
                        Link to Razorpay
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
