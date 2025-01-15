"use client";

import { Button } from "@/components/ui/button-dash";
import { DialogClose, DialogFooter } from "@/components/ui/dialog-dash";
import { Form, FormField } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    CreateCategoryRequest,
    createCategoryRequestSchema,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    brandId: string;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function RequestCategoryForm({ brandId, setIsOpen }: PageProps) {
    const form = useForm<CreateCategoryRequest>({
        resolver: zodResolver(createCategoryRequestSchema),
        defaultValues: {
            content: "",
            brandId,
        },
    });

    const { mutate: sendRequest, isPending: isSending } =
        trpc.brands.categoryRequests.createCategoryRequest.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Sending request...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                form.reset();
                setIsOpen(false);
                toast.success("Request sent, we will get back to you soon.", {
                    id: toastId,
                });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => sendRequest(values))}
            >
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <Textarea
                            {...field}
                            placeholder="I would like to request a product type 'ABC', under the subcategory 'DEF', under the category 'GHI'."
                            minRows={6}
                            disabled={isSending}
                        />
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="reset"
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={isSending}
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        size="sm"
                        className="h-8"
                        disabled={isSending || !form.formState.isDirty}
                    >
                        Request
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
