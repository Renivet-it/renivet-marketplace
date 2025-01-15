"use client";

import { TableCategoryRequest } from "@/components/dashboard/category-requests";
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
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    request: TableCategoryRequest;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function CategoryRequestApproveModal({
    request,
    isOpen,
    setIsOpen,
}: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [status] = useQueryState(
        "status",
        parseAsStringLiteral([
            "pending",
            "approved",
            "rejected",
        ] as const).withDefault("pending")
    );

    const { refetch } = trpc.general.categories.requests.getRequests.useQuery({
        page,
        limit,
        status,
    });

    const { mutate: approveRequest, isPending: isUpdating } =
        trpc.general.categories.requests.approveRequest.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Approving category request...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Category request approved", { id: toastId });
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
                        Are you sure you want to approve this category request?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        You will also have to make the requested category
                        manually in the dashboard.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        disabled={isUpdating}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => approveRequest({ id: request.id })}
                    >
                        Approve
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
