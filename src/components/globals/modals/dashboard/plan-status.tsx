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
import { Plan } from "@/lib/validations";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    plan: Plan;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function PlanStatusModal({ plan, isOpen, setIsOpen }: PageProps) {
    const { refetch } = trpc.general.plans.getPlans.useQuery({});

    const { mutate: updatePlanStatus, isPending: isUpdating } =
        trpc.general.plans.updatePlanStatus.useMutation({
            onMutate: ({ isActive }) => {
                const toastId = toast.loading(
                    !isActive ? "Deactivating plan..." : "Activating plan..."
                );
                return { toastId };
            },
            onSuccess: (_, { isActive }, { toastId }) => {
                toast.success(
                    !isActive ? "Plan deactivated" : "Plan activated",
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
                        {plan.isActive ? "deactivate" : "activate"} this plan?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {plan.isActive
                            ? "This plan will no longer be available to brands."
                            : "This plan will be available to brands and they can subscribe to it."}
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
                            updatePlanStatus({
                                id: plan.id,
                                isActive: !plan.isActive,
                            })
                        }
                    >
                        {plan.isActive ? "Deactivate" : "Activate"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
