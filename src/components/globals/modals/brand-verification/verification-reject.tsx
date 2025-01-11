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
    BrandConfidential,
    BrandConfidentialWithBrand,
    RejectBrandRequest,
    rejectBrandRequestSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    data: BrandConfidentialWithBrand;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function VerificationRejectModal({
    data,
    isOpen,
    setIsOpen,
}: PageProps) {
    const router = useRouter();

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
    const { refetch } =
        trpc.general.brands.verifications.getVerifications.useQuery({
            page,
            limit,
            search,
            status,
        });

    const { mutate: rejectVerification, isPending: isRejecting } =
        trpc.general.brands.verifications.rejectVerification.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    "Rejecting brand verification request..."
                );
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Brand verification request rejected", {
                    id: toastId,
                });
                setIsOpen(false);
                refetch();
                router.refresh();
                router.push("/dashboard/general/brands/verifications");
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
                        Are you sure you want to reject this verification
                        request?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Rejecting this request will notify the brand and they
                        will have to delete their brand and start over.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <Form {...form}>
                    <form
                        className="space-y-4"
                        onSubmit={form.handleSubmit((values) =>
                            rejectVerification({
                                id: data.id,
                                rejectedReason: values.rejectionReason,
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
                                            disabled={isRejecting}
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
                                disabled={isRejecting}
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={isRejecting}
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
