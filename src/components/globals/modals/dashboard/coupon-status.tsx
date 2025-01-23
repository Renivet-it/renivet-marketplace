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

export function CouponStatusModal({ coupon, isOpen, setIsOpen }: PageProps) {
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

    const { mutate: updateCouponStatus, isPending: isUpdating } =
        trpc.general.coupons.updateCouponStatus.useMutation({
            onMutate: ({ isActive }) => {
                const toastId = toast.loading(
                    !isActive
                        ? "Deactivating coupon..."
                        : "Activating coupon..."
                );
                return { toastId };
            },
            onSuccess: (_, { isActive }, { toastId }) => {
                toast.success(
                    !isActive ? "Coupon deactivated" : "Coupon activated",
                    {
                        id: toastId,
                    }
                );
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
                        Are you sure you want to{" "}
                        {coupon.isActive ? "deactivate" : "activate"} this
                        coupon?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {coupon.isActive
                            ? "This will deactivate the coupon and it will not be available for use."
                            : "This will activate the coupon and it will be available for use."}
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
                            updateCouponStatus({
                                code: coupon.code,
                                isActive: !coupon.isActive,
                            })
                        }
                    >
                        {coupon.isActive ? "Deactivate" : "Activate"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
