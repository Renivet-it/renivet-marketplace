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
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface PageProps {
    request: BrandRequest;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function RequestApproveModal({ request, isOpen, setIsOpen }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });
    const [status] = useQueryState(
        "status",
        parseAsStringLiteral([
            "pending",
            "approved",
            "rejected",
        ] as const).withDefault("pending")
    );
    const { refetch } = trpc.brands.requests.getRequests.useQuery({
        page,
        limit,
        search,
        status,
    });

    const { mutate: approveRequest, isPending: isRequestApproving } =
        trpc.brands.requests.updateRequestStatus.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Approving brand request...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Brand request approved", {
                    id: toastId,
                });
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
                        Are you sure you want to approve this request?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Approving this brand request will make it live on the
                        platform. They will be notified about the approval.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isRequestApproving}
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        size="sm"
                        disabled={isRequestApproving}
                        onClick={() =>
                            approveRequest({
                                id: request.id,
                                data: {
                                    status: "approved",
                                    rejectionReason: null,
                                },
                            })
                        }
                    >
                        Approve
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
