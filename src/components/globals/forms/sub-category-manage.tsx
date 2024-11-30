"use client";

import { TableSubCategory } from "@/components/dashboard/general/sub-categories";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import { CreateSubCategory, createSubCategorySchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    subCategory?: TableSubCategory;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function SubCategoryManageForm({ subCategory, setIsOpen }: PageProps) {
    const form = useForm<CreateSubCategory>({
        resolver: zodResolver(createSubCategorySchema),
        defaultValues: {
            name: subCategory?.name ?? "",
            description: subCategory?.description ?? "",
            categoryId: subCategory?.categoryId ?? "",
        },
    });

    const { refetch } = trpc.general.subCategories.getSubCategories.useQuery();
    const { data } = trpc.general.categories.getCategories.useQuery();

    const { mutate: createSubCategory, isPending: isSubCategoryCreating } =
        trpc.general.subCategories.createSubCategory.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating sub-category...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Sub Category created successfully", {
                    id: toastId,
                });
                setIsOpen(false);
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateSubCategory, isPending: isSubCategoryUpdating } =
        trpc.general.subCategories.updateSubCategory.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating sub-category...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Sub Category updated successfully", {
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
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) =>
                    subCategory
                        ? updateSubCategory({
                              id: subCategory.id,
                              data: values,
                          })
                        : createSubCategory(values)
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
                                    placeholder="Enter sub-category name"
                                    disabled={
                                        isSubCategoryCreating ||
                                        isSubCategoryUpdating
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
                                    placeholder="Enter sub-category description"
                                    disabled={
                                        isSubCategoryCreating ||
                                        isSubCategoryUpdating
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
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>

                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={
                                    isSubCategoryCreating ||
                                    isSubCategoryUpdating ||
                                    !data?.data.length
                                }
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>

                                <SelectContent>
                                    {data?.data?.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

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
                            disabled={
                                isSubCategoryCreating || isSubCategoryUpdating
                            }
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        size="sm"
                        disabled={
                            isSubCategoryCreating ||
                            isSubCategoryUpdating ||
                            !form.formState.isDirty
                        }
                    >
                        {subCategory ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
