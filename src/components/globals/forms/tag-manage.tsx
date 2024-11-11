"use client";

import { TableTag } from "@/components/dashboard/tags";
import { Button } from "@/components/ui/button-dash";
import { DialogClose, DialogFooter } from "@/components/ui/dialog-dash";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { CreateTag, createTagSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    tag?: TableTag;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function TagManageForm({ tag, setIsOpen }: PageProps) {
    const form = useForm<CreateTag>({
        resolver: zodResolver(createTagSchema),
        defaultValues: {
            name: tag?.name ?? "",
        },
    });

    const { refetch } = trpc.tags.getTags.useQuery();

    const { mutate: createTag, isPending: isTagCreating } =
        trpc.tags.createTag.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating tag...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Tag created successfully", { id: toastId });
                setIsOpen(false);
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateTag, isPending: isTagUpdating } =
        trpc.tags.updateTag.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating tag...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Tag updated successfully", { id: toastId });
                setIsOpen(false);
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) =>
                    tag
                        ? updateTag({ id: tag.id, data: values })
                        : createTag(values)
                )}
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tag Name</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter tag name"
                                    disabled={isTagCreating || isTagUpdating}
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="reset"
                            variant="ghost"
                            size="sm"
                            disabled={isTagCreating || isTagUpdating}
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        size="sm"
                        disabled={
                            isTagCreating ||
                            isTagUpdating ||
                            !form.formState.isDirty
                        }
                    >
                        {tag ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
