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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    BrandRequest,
    RejectBrandRequest,
    rejectBrandRequestSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    request: BrandRequest;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function RequestRejectModal({ request, isOpen, setIsOpen }: PageProps) {
    const form = useForm<RejectBrandRequest>({
        resolver: zodResolver(rejectBrandRequestSchema),
        defaultValues: {
            rejectionReason: "",
        },
    });

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
    const { refetch } = trpc.general.brands.requests.getRequests.useQuery({
        page,
        limit,
        search,
        status,
    });

    const { mutate: rejectRequest, isPending: isRequestRejecting } =
        trpc.general.brands.requests.updateRequestStatus.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Rejecting brand request...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Brand request rejected", {
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
                        Are you sure you want to reject this request?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Rejecting this request will notify the user that their
                        request has been rejected, and will set a timer for them
                        to reapply.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <Form {...form}>
                    <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit((values) =>
                            rejectRequest({
                                id: request.id,
                                data: {
                                    status: "rejected",
                                    rejectionReason: values.rejectionReason,
                                },
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
                                            minRows={3}
                                            placeholder="Enter a reason for rejecting this request"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <AlertDialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isRequestRejecting}
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={isRequestRejecting}
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
