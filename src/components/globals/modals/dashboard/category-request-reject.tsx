"use client";

import { TableCategoryRequest } from "@/components/dashboard/category-requests";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-dash";
import { Button } from "@/components/ui/button-dash";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    UpdateCategoryRequestStatus,
    updateCategoryRequestStatusSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    request: TableCategoryRequest;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function CategoryRequestRejectModal({
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

    const form = useForm<UpdateCategoryRequestStatus>({
        resolver: zodResolver(updateCategoryRequestStatusSchema),
        defaultValues: {
            rejectionReason: "",
            status: "rejected",
        },
    });

    const { mutate: rejectProduct, isPending: isUpdating } =
        trpc.general.categories.requests.rejectRequest.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Rejecting category request...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Category request rejected", { id: toastId });
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
                        Are you sure you want to reject this category request?
                    </AlertDialogTitle>
                </AlertDialogHeader>

                <Form {...form}>
                    <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit((values) =>
                            rejectProduct({
                                id: request.id,
                                rejectionReason: values.rejectionReason,
                            })
                        )}
                    >
                        <FormField
                            control={form.control}
                            name="rejectionReason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rejection Reason</FormLabel>

                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            minRows={5}
                                            placeholder="Enter rejection reason"
                                            value={field.value ?? ""}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <AlertDialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                                disabled={isUpdating}
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                variant="destructive"
                                size="sm"
                                disabled={isUpdating}
                            >
                                Reject
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </Form>
            </AlertDialogContent>
        </AlertDialog>
    );
}
