"use client";

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
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function TagManageForm({ setIsOpen }: PageProps) {
    const form = useForm<CreateTag>({
        resolver: zodResolver(createTagSchema),
        defaultValues: {
            name: "",
        },
    });

    const { mutate: createTag, isPending: isTagCreating } =
        trpc.tags.createTag.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating tag...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Tag created successfully", { id: toastId });
                setIsOpen(false);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => createTag(values))}
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
                                    disabled={isTagCreating}
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
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isTagCreating}
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button type="submit" size="sm" disabled={isTagCreating}>
                        Create
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
