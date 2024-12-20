"use client";

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
    ProductWithBrand,
    RejectProduct,
    rejectProductSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    product: ProductWithBrand;
}

export function ProductRejectForm({ product }: PageProps) {
    const router = useRouter();

    const form = useForm<RejectProduct>({
        resolver: zodResolver(rejectProductSchema),
        defaultValues: {
            id: product.id,
            rejectionReason: "",
        },
    });

    const { mutate: rejectProduct, isPending: isRejecting } =
        trpc.general.productReviews.rejectProduct.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Rejecting product...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product rejected", { id: toastId });
                router.push("/dashboard/general/products");
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => rejectProduct(values))}
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

                <Button
                    size="sm"
                    className="w-full"
                    disabled={!form.formState.isDirty || isRejecting}
                >
                    Reject Product
                </Button>
            </form>
        </Form>
    );
}
