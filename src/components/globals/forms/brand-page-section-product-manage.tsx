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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { trpc } from "@/lib/trpc/client";
import {
    convertPaiseToRupees,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import {
    CachedBrand,
    CreateBrandPageSectionProduct,
    createBrandPageSectionProductSchema,
    ProductWithBrand,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface PageProps {
    brand: CachedBrand;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    products: ProductWithBrand[];
    pageSection: CachedBrand["pageSections"][number];
}

export function BrandPageSectionProductManage({
    brand,
    setIsOpen,
    products,
    pageSection,
}: PageProps) {
    const form = useForm<CreateBrandPageSectionProduct>({
        resolver: zodResolver(createBrandPageSectionProductSchema),
        defaultValues: {
            brandPageSectionId: pageSection.id,
            position:
                (brand.pageSections.find(
                    (section) => section.id === pageSection.id
                )?.sectionProducts.length || 0) + 1,
            productId: "",
        },
    });

    const { refetch } = trpc.brands.brands.getBrand.useQuery({
        id: brand.id,
    });

    const { mutate: addProduct, isPending: isAdding } =
        trpc.brands.pageSections.products.createBrandPageSectionProduct.useMutation(
            {
                onMutate: () => {
                    const toastId = toast.loading("Adding product...");
                    return { toastId };
                },
                onSuccess: (_, __, { toastId }) => {
                    setIsOpen(false);
                    refetch();
                    return toast.success("Product added", { id: toastId });
                },
                onError: (err, _, ctx) => {
                    return handleClientError(err, ctx?.toastId);
                },
            }
        );

    return (
        <Form {...form}>
            <form
                className="space-y-4"
                onSubmit={form.handleSubmit((values) => addProduct(values))}
            >
                <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product</FormLabel>

                            <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isAdding}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a product" />
                                    </SelectTrigger>
                                </FormControl>

                                <SelectContent>
                                    {products.map((product) => {
                                        let price: string;

                                        if (product.variants.length === 0) {
                                            price = formatPriceTag(
                                                parseFloat(
                                                    convertPaiseToRupees(
                                                        product.price ?? 0
                                                    )
                                                ),
                                                true
                                            );
                                        } else {
                                            const minPriceRaw = Math.min(
                                                ...product.variants.map(
                                                    (x) => x.price
                                                )
                                            );
                                            const maxPriceRaw = Math.max(
                                                ...product.variants.map(
                                                    (x) => x.price
                                                )
                                            );

                                            const minPrice = formatPriceTag(
                                                parseFloat(
                                                    convertPaiseToRupees(
                                                        minPriceRaw
                                                    )
                                                ),
                                                true
                                            );
                                            const maxPrice = formatPriceTag(
                                                parseFloat(
                                                    convertPaiseToRupees(
                                                        maxPriceRaw
                                                    )
                                                ),
                                                true
                                            );

                                            if (minPriceRaw === maxPriceRaw)
                                                price = minPrice;
                                            else
                                                price = `${minPrice} - ${maxPrice}`;
                                        }

                                        return (
                                            <SelectItem
                                                key={product.id}
                                                value={product.id}
                                                disabled={pageSection.sectionProducts.some(
                                                    (x) =>
                                                        x.product.id ===
                                                        product.id
                                                )}
                                            >
                                                <div className="flex flex-row items-center gap-4">
                                                    <div className="aspect-square size-6 overflow-hidden rounded-full">
                                                        <Image
                                                            src={
                                                                product.media[0]
                                                                    .mediaItem!
                                                                    .url
                                                            }
                                                            alt={product.title}
                                                            width={64}
                                                            height={64}
                                                            className="size-full object-cover"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2 font-semibold">
                                                        <p>
                                                            {product.title
                                                                .length > 20
                                                                ? product.title.slice(
                                                                      0,
                                                                      20
                                                                  ) + "..."
                                                                : product.title}
                                                        </p>
                                                        {" - "}
                                                        <p className="text-sm">
                                                            {price}
                                                        </p>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
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
                            disabled={isAdding}
                        >
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        type="submit"
                        size="sm"
                        disabled={isAdding || !form.formState.isDirty}
                    >
                        Add Product
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
