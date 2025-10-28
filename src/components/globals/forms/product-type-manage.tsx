"use client";

import { TableProductType } from "@/components/dashboard/general/product-types";
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
import { CreateProductType, createProductTypeSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    productType?: TableProductType;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function ProductTypeManageForm({ productType, setIsOpen }: PageProps) {
    const form = useForm<CreateProductType>({
        resolver: zodResolver(createProductTypeSchema),
        defaultValues: {
            name: productType?.name ?? "",
            description: productType?.description ?? "",
            categoryId: productType?.categoryId ?? "",
            subCategoryId: productType?.subCategoryId ?? "",
            priorityId: productType?.priorityId ?? 0,    // added by rachana

        },
    });

    const { refetch } = trpc.general.productTypes.getProductTypes.useQuery();
    const { data: categoryData } =
        trpc.general.categories.getCategories.useQuery();
    const { data: subCategoryData } =
        trpc.general.subCategories.getSubCategories.useQuery();

    const { mutate: createProductType, isPending: isProductTypeCreating } =
        trpc.general.productTypes.createProductType.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Creating product type...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product Type created successfully", {
                    id: toastId,
                });
                setIsOpen(false);
                refetch();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateProductType, isPending: isProductTypeUpdating } =
        trpc.general.productTypes.updateProductType.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating product type...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product Type updated successfully", {
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
                    productType
                        ? updateProductType({
                              id: productType.id,
                              data: values,
                          })
                        : createProductType(values)
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
                                    placeholder="Enter product type name"
                                    disabled={
                                        isProductTypeCreating ||
                                        isProductTypeUpdating
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
                                    placeholder="Enter product type description"
                                    disabled={
                                        isProductTypeCreating ||
                                        isProductTypeUpdating
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
                                    isProductTypeCreating ||
                                    isProductTypeUpdating ||
                                    !categoryData?.data?.length
                                }
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                </FormControl>

                                <SelectContent>
                                    {categoryData?.data
                                        ?.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))
                                        .reverse()}
                                </SelectContent>
                            </Select>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="subCategoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sub Category</FormLabel>

                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={
                                    isProductTypeCreating ||
                                    isProductTypeUpdating ||
                                    !subCategoryData?.data?.length ||
                                    !form.watch("categoryId") ||
                                    (form.watch("categoryId")
                                        ? !subCategoryData?.data.some(
                                              (sub) =>
                                                  sub.categoryId ===
                                                  form.watch("categoryId")
                                          )
                                        : false)
                                }
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a sub category" />
                                    </SelectTrigger>
                                </FormControl>

                                <SelectContent>
                                    {subCategoryData?.data
                                        ?.filter(
                                            (sub) =>
                                                sub.categoryId ===
                                                form.watch("categoryId")
                                        )
                                        .reverse()
                                        .map((subCategory) => (
                                            <SelectItem
                                                key={subCategory.id}
                                                value={subCategory.id}
                                            >
                                                {subCategory.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                   {/* ✅ Priority ID */}
                   <FormField
                    control={form.control}
                    name="priorityId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Priority ID</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Enter priority ID"
                                    disabled={
                                        isProductTypeCreating ||
                                        isProductTypeUpdating
                                    }
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(Number(e.target.value))} // ✅ convert to number
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
                            disabled={
                                isProductTypeCreating || isProductTypeUpdating
                            }
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        size="sm"
                        disabled={
                            isProductTypeCreating ||
                            isProductTypeUpdating ||
                            !form.formState.isDirty
                        }
                    >
                        {productType ? "Update" : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
