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
import { Coupon } from "@/lib/validations";
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    coupon: Coupon;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function CouponDeleteModal({ coupon, isOpen, setIsOpen }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });
    const [isActive] = useQueryState(
        "isActive",
        parseAsBoolean.withDefault(true)
    );

    const { refetch } = trpc.general.coupons.getCoupons.useQuery({
        page,
        limit,
        search,
        isActive,
    });

    const { mutate: deleteCoupon, isPending: isDeleting } =
        trpc.general.coupons.deleteCoupon.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Deleting coupon...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Coupon deleted", { id: toastId });
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
                        Are you sure you want to delete this coupon?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Deleting this coupon will remove it from the system.
                        This action cannot be undone.
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
                            deleteCoupon({
                                code: coupon.code,
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
