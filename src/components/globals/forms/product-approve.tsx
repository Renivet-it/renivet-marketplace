"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc/client";
import { handleClientError } from "@/lib/utils";
import {
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
    CreateCategorizeProduct,
    createCategorizeProductSchema,
    ProductWithBrand,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    product: ProductWithBrand;
    allCategories: CachedCategory[];
    allSubCategories: CachedSubCategory[];
    allProductTypes: CachedProductType[];
}

export function ProductApproveForm({
    product,
    allCategories,
    allProductTypes,
    allSubCategories,
}: PageProps) {
    const router = useRouter();

    const {
        data: { data: categories },
    } = trpc.general.categories.getCategories.useQuery(undefined, {
        initialData: {
            data: allCategories,
            count: allCategories.length,
        },
    });
    const {
        data: { data: subCategories },
    } = trpc.general.subCategories.getSubCategories.useQuery(undefined, {
        initialData: {
            data: allSubCategories,
            count: allSubCategories.length,
        },
    });
    const {
        data: { data: productTypes },
    } = trpc.general.productTypes.getProductTypes.useQuery(undefined, {
        initialData: {
            data: allProductTypes,
            count: allProductTypes.length,
        },
    });

    const { refetch } = trpc.brands.products.getProduct.useQuery(
        { productId: product.id },
        { initialData: product }
    );

    const form = useForm<CreateCategorizeProduct>({
        resolver: zodResolver(createCategorizeProductSchema),
        defaultValues: {
            productId: product.id,
            categories:
                product.categories.length > 0
                    ? product.categories.map((cat) => ({
                          id:
                              Date.now().toString() +
                              Math.random().toString(36).slice(6),
                          categoryId: cat.category.id,
                          subcategoryId: cat.subcategory.id,
                          productTypeId: cat.productType.id,
                      }))
                    : [],
        },
    });

    useEffect(() => {
        if (form.formState.errors.categories?.root?.message)
            toast.error(form.formState.errors.categories.root.message);
    }, [form.formState.errors]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "categories",
    });

    const handleCategoryClick = (categoryId: string) => {
        append({
            id: Date.now().toString(),
            categoryId,
            subcategoryId: "",
            productTypeId: "",
        });
    };

    const handleRemove = (id: string) => {
        const index = fields.findIndex((field) => field.id === id);
        if (index !== -1) remove(index);
    };

    const getSubcategoriesForCategory = (categoryId: string) => {
        return subCategories.filter((sub) => sub.categoryId === categoryId);
    };

    const getProductTypesForSubcategory = (subcategoryId: string) => {
        return productTypes.filter(
            (type) => type.subCategoryId === subcategoryId
        );
    };

    const categoryCounts = useMemo(() => {
        return fields.reduce(
            (acc, field) => {
                acc[field.categoryId] = (acc[field.categoryId] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );
    }, [fields]);

    const sortedFields = useMemo(
        () =>
            [...fields].sort((a, b) => {
                const categoryA = categories.find((c) => c.id === a.categoryId);
                const categoryB = categories.find((c) => c.id === b.categoryId);
                if (!categoryA || !categoryB) return 0;

                return categoryA.name.localeCompare(categoryB.name);
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [fields]
    );

    const { mutate: approveProduct, isPending: isApproving } =
        trpc.general.productReviews.approveProduct.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Approving product...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product approved successfully", {
                    id: toastId,
                });
                refetch();
                router.push("/dashboard/general/products");
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-6"
                onSubmit={form.handleSubmit((values) => approveProduct(values))}
            >
                <div className="space-y-2">
                    <h3 className="text-sm">Categorize</h3>

                    <div className="flex flex-wrap gap-2">
                        {categories
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((category) => (
                                <Button
                                    key={category.id}
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        handleCategoryClick(category.id)
                                    }
                                    className="min-w-[80px]"
                                    disabled={isApproving}
                                >
                                    <span>{category.name}</span>
                                    {categoryCounts[category.id] > 0 && (
                                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                            {categoryCounts[category.id]}
                                        </span>
                                    )}
                                </Button>
                            ))}
                    </div>
                </div>

                {sortedFields.length > 0 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <h4 className="text-sm font-medium">Category</h4>
                            <h4 className="text-sm font-medium">
                                Sub Category
                            </h4>
                            <h4 className="text-sm font-medium">
                                Product Type
                            </h4>
                            <h4 className="text-sm font-medium">Action</h4>
                        </div>

                        <Separator />

                        {sortedFields.map((field) => {
                            const category = categories.find(
                                (c) => c.id === field.categoryId
                            );

                            const subCategoryField =
                                `categories.${fields.findIndex(
                                    (f) => f.id === field.id
                                )}.subcategoryId` as const;
                            const productTypeField =
                                `categories.${fields.findIndex(
                                    (f) => f.id === field.id
                                )}.productTypeId` as const;

                            return (
                                <div
                                    key={field.id}
                                    className="grid grid-cols-4 items-center gap-4"
                                >
                                    <div className="text-sm">
                                        {category?.name}
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name={subCategoryField}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                    disabled={
                                                        isApproving ||
                                                        getSubcategoriesForCategory(
                                                            category?.id || ""
                                                        ).length === 0
                                                    }
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="border-gray-700">
                                                            <SelectValue placeholder="Select a sub-category" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {getSubcategoriesForCategory(
                                                            category?.id || ""
                                                        ).map((sub) => (
                                                            <SelectItem
                                                                key={sub.id}
                                                                value={sub.id}
                                                            >
                                                                {sub.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name={productTypeField}
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    defaultValue={field.value}
                                                    disabled={
                                                        isApproving ||
                                                        getProductTypesForSubcategory(
                                                            form.watch(
                                                                subCategoryField
                                                            )
                                                        ).length === 0
                                                    }
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="border-gray-700">
                                                            <SelectValue placeholder="Select a product type" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {getProductTypesForSubcategory(
                                                            form.watch(
                                                                subCategoryField
                                                            )
                                                        ).map((type) => (
                                                            <SelectItem
                                                                key={type.id}
                                                                value={type.id}
                                                            >
                                                                {type.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemove(field.id)}
                                        className="size-8"
                                        disabled={isApproving}
                                    >
                                        <Icons.X className="size-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <Separator />

                <Button
                    type="submit"
                    className="w-full"
                    disabled={isApproving || !form.formState.isDirty}
                >
                    Approve
                </Button>
            </form>
        </Form>
    );
}
