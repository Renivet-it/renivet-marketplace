"use client";

import { Button } from "@/components/ui/button-dash";
import { Editor, EditorRef } from "@/components/ui/editor";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { CachedLegal, CreateLegal, createLegalSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    legal: CachedLegal | null;
}

export function ShippingPolicyManageForm({ legal }: PageProps) {
    const editorRef = useRef<EditorRef>(null!);

    const form = useForm<CreateLegal>({
        resolver: zodResolver(createLegalSchema),
        defaultValues: {
            privacyPolicy: legal?.privacyPolicy || "",
            termsOfService: legal?.termsOfService || "",
            refundPolicy: legal?.refundPolicy || "",
            shippingPolicy: legal?.shippingPolicy || "",
        },
    });

    const { mutate: updateLegal, isPending: isUpdating } =
        trpc.general.legal.updateLegal.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating shipping policy...");
                return { toastId };
            },
            onSuccess: (_, values, { toastId }) => {
                toast.success("Shipping policy updated successfully", {
                    id: toastId,
                });
                form.reset({
                    shippingPolicy: values.shippingPolicy as string,
                });
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) => updateLegal(values))}
            >
                <FormField
                    control={form.control}
                    name="shippingPolicy"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="sr-only">
                                Shipping Policy
                            </FormLabel>

                            <FormControl>
                                <Editor
                                    {...field}
                                    ref={editorRef}
                                    content={field.value ?? ""}
                                    onChange={field.onChange}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={!form.formState.isDirty || isUpdating}
                    className="w-full"
                >
                    {legal?.shippingPolicy ? "Update" : "Add"} Shipping Policy
                </Button>
            </form>
        </Form>
    );
}
