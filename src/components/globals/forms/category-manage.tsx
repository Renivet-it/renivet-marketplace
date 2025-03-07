"use client";

import { TableCategory } from "@/components/dashboard/general/categories";
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
import PriceInput from "@/components/ui/price-input";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { CreateCategory, createCategorySchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    category?: TableCategory;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function CategoryManageForm({ category, setIsOpen }: PageProps) {
    const form = useForm<CreateCategory>({
        resolver: zodResolver(createCategorySchema),
        defaultValues: {
            name: category?.name ?? "",
            description: category?.description ?? "",
            commissionRate: category?.commissionRate ?? 0,
        },
    });

    const { refetch } = trpc.general.categories.getCategories.useQuery();

    const { mutate: createCategory, isPending: isCategoryCreating } =
        trpc.general.categories.createCategory.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating category...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Category created successfully", { id: toastId });
                setIsOpen(false);
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateCategory, isPending: isCategoryUpdating } =
        trpc.general.categories.updateCategory.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating category...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Category updated successfully", { id: toastId });
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
                    category
                        ? updateCategory({ id: category.id, data: values })
                        : createCategory(values)
                )}
            >
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter category name"
                                    disabled={
                                        isCategoryCreating || isCategoryUpdating
                                    }
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>

                            <FormControl>
                                <Input
                                    placeholder="Enter category description"
                                    disabled={
                                        isCategoryCreating || isCategoryUpdating
                                    }
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="commissionRate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Commission Rate</FormLabel>

                            <FormControl>
                                <PriceInput
                                    {...field}
                                    placeholder="Enter discount value"
                                    currency="%"
                                    value={field.value}
                                    disabled={
                                        isCategoryCreating || isCategoryUpdating
                                    }
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        const limitedValue =
                                            value > 99 ? 99 : value;

                                        field.onChange(
                                            isNaN(limitedValue)
                                                ? 0
                                                : limitedValue
                                        );
                                    }}
                                    maxLength={2}
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
                            disabled={isCategoryCreating || isCategoryUpdating}
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        size="sm"
                        disabled={
                            isCategoryCreating ||
                            isCategoryUpdating ||
                            !form.formState.isDirty
                        }
                    >
                        {category ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
