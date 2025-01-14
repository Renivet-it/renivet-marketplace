"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Editor, EditorRef } from "@/components/ui/editor";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import { Label } from "@/components/ui/label";
import PriceInput from "@/components/ui/price-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea-dash";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc/client";
import { cn, generateSKU, handleClientError } from "@/lib/utils";
import {
    BrandMediaItem,
    CachedBrand,
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
    CreateProduct,
    createProductSchema,
    ProductWithBrand,
} from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { Country } from "country-state-city";
import { Tag, TagInput } from "emblor";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { MediaSelectModal } from "../modals";
import { ProductVariantManage } from "./product-variant-manage";

interface PageProps {
    brandId: string;
    brand: CachedBrand;
    product?: ProductWithBrand;
    allCategories: CachedCategory[];
    allSubCategories: CachedSubCategory[];
    allProductTypes: CachedProductType[];
    allMedia: BrandMediaItem[];
}

export function ProductManageForm({
    brandId,
    brand,
    product,
    allCategories,
    allProductTypes,
    allSubCategories,
    allMedia,
}: PageProps) {
    const router = useRouter();

    const mediaItems = product?.media
        ? product.media.map((m) => m.mediaItem!).filter(Boolean)
        : [];

    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] =
        useState<BrandMediaItem[]>(mediaItems);
    const [isSusCertificateSelectorOpen, setIsSusCertificateSelectorOpen] =
        useState(false);
    const [selectedSusCertificate, setSelectedSusCertificate] =
        useState<BrandMediaItem | null>(
            product?.sustainabilityCertificate ?? null
        );
    const [tags, setTags] = useState<Tag[]>(
        product?.metaKeywords.map((tag, i) => ({ id: `${i}`, text: tag })) ?? []
    );
    const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

    const editorRef = useRef<EditorRef>(null!);

    const {
        data: { data: mediaRaw },
    } = trpc.brands.media.getMediaItems.useQuery(
        { brandId },
        { initialData: { data: allMedia, count: allMedia.length } }
    );

    const media = mediaRaw.filter(
        (m) => m.type.includes("image") || m.type.includes("video")
    );
    const docs = mediaRaw.filter((m) => m.type.includes("pdf"));

    const form = useForm<CreateProduct>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            // GENERAL
            brandId,
            title: product?.title ?? "",
            description: product?.description ?? "",
            media: product?.media ?? [],
            categoryId: product?.categoryId ?? "",
            subcategoryId: product?.subcategoryId ?? "",
            productTypeId: product?.productTypeId ?? "",
            sustainabilityCertificate:
                product?.sustainabilityCertificate?.id ?? "",
            productHasVariants: product?.productHasVariants ?? false,

            // PRICING
            price: product?.price ?? 0,
            compareAtPrice: product?.compareAtPrice ?? 0,
            costPerItem: product?.costPerItem ?? 0,

            // INVENTORY
            nativeSku: product?.nativeSku ?? generateSKU({ brand }),
            sku: product?.sku ?? "",
            barcode: product?.barcode ?? "",
            quantity: product?.quantity ?? 0,

            // SHIPPING
            weight: product?.weight ?? 0,
            length: product?.length ?? 0,
            width: product?.width ?? 0,
            height: product?.height ?? 0,
            originCountry: product?.originCountry ?? "",
            hsCode: product?.hsCode ?? "",

            // VARIANTS
            options: product?.options ?? [],
            variants: product?.variants ?? [],

            // SEO
            metaTitle: product?.metaTitle ?? "",
            metaDescription: product?.metaDescription ?? "",
            metaKeywords: product?.metaKeywords ?? [],
        },
    });

    const {
        fields: optionFields,
        append: appendOption,
        remove: removeOption,
    } = useFieldArray({
        control: form.control,
        name: "options",
    });

    const { fields: variantFields, replace: replaceVariants } = useFieldArray({
        control: form.control,
        name: "variants",
    });

    const countries = useMemo(() => Country.getAllCountries(), []);

    const profitOnItem = useMemo(() => {
        const priceInPaise = form.watch("price");
        const costPerItemInPaise = form.watch("costPerItem");

        if (!priceInPaise || !costPerItemInPaise) return 0;

        return priceInPaise - costPerItemInPaise;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form.watch("price"), form.watch("costPerItem")]);

    const marginOnItem = useMemo(() => {
        const priceInPaise = form.watch("price");
        const costPerItemInPaise = form.watch("costPerItem");

        if (!priceInPaise || !costPerItemInPaise) return 0;

        return +((profitOnItem / priceInPaise) * 100).toFixed(2);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profitOnItem]);

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

    const getSubCategories = useCallback(
        (categoryId: string) => {
            return subCategories.filter(
                (subCategory) => subCategory.categoryId === categoryId
            );
        },
        [subCategories]
    );

    const getProductTypes = useCallback(
        (subcategoryId: string) => {
            return productTypes.filter(
                (productType) => productType.subCategoryId === subcategoryId
            );
        },
        [productTypes]
    );

    const { mutate: createProduct, isPending: isCreating } =
        trpc.brands.products.createProduct.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Saving product...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product saved successfully", { id: toastId });
                form.reset(form.getValues());
                router.push(`/brands/${brandId}/products`);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: updateProduct, isPending: isUpdating } =
        trpc.brands.products.updateProduct.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Updating product...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Product updated successfully", { id: toastId });
                form.reset(form.getValues());
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const isPending = isCreating || isUpdating;

    return (
        <>
            <Form {...form}>
                <form
                    className="space-y-6"
                    onSubmit={form.handleSubmit((values) =>
                        product
                            ? updateProduct({
                                  productId: product.id,
                                  values,
                              })
                            : createProduct(values)
                    )}
                >
                    <Card>
                        <CardHeader className="hidden">
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4 p-4 md:p-6">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>

                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Checked Casual Shirt"
                                                className="h-9"
                                                disabled={isPending}
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
                                            <Editor
                                                {...field}
                                                ref={editorRef}
                                                content={field.value ?? ""}
                                                onChange={field.onChange}
                                                classNames={{
                                                    innerWrapper: "min-h-40",
                                                }}
                                                disabled={isPending}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="media"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>Media</FormLabel>

                                        <FormControl>
                                            {selectedMedia.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
                                                    {selectedMedia.map(
                                                        (media, i) => (
                                                            <div
                                                                key={media.id}
                                                                className={cn(
                                                                    "aspect-square overflow-hidden rounded-md border p-2 transition-all ease-in-out hover:bg-muted",
                                                                    i === 0 &&
                                                                        "col-span-2 row-span-2"
                                                                )}
                                                            >
                                                                <Image
                                                                    src={
                                                                        media.url
                                                                    }
                                                                    alt={
                                                                        media.alt ||
                                                                        media.name
                                                                    }
                                                                    height={500}
                                                                    width={500}
                                                                    className="size-full rounded-sm object-cover"
                                                                />
                                                            </div>
                                                        )
                                                    )}

                                                    <div className="aspect-square">
                                                        <button
                                                            type="button"
                                                            className="flex size-full items-center justify-center rounded-md border bg-muted p-2 transition-all ease-in-out hover:bg-muted/60"
                                                            onClick={() => {
                                                                setIsMediaSelectorOpen(
                                                                    true
                                                                );
                                                            }}
                                                            disabled={isPending}
                                                        >
                                                            <Icons.Plus />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-foreground/40 p-5">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() =>
                                                            setIsMediaSelectorOpen(
                                                                true
                                                            )
                                                        }
                                                        disabled={isPending}
                                                    >
                                                        <Icons.CloudUpload />
                                                        Upload Media
                                                    </Button>
                                                </div>
                                            )}
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="sustainabilityCertificate"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>
                                            Sustainability Certificate
                                        </FormLabel>

                                        <FormControl>
                                            {selectedSusCertificate ? (
                                                <div className="space-y-2">
                                                    <div className="size-full">
                                                        <object
                                                            data={
                                                                selectedSusCertificate.url
                                                            }
                                                            type="application/pdf"
                                                            width="100%"
                                                            height={300}
                                                        >
                                                            <Link
                                                                href={
                                                                    selectedSusCertificate.url
                                                                }
                                                            >
                                                                Download
                                                                Document
                                                            </Link>
                                                        </object>
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-9"
                                                            onClick={() =>
                                                                setIsSusCertificateSelectorOpen(
                                                                    true
                                                                )
                                                            }
                                                        >
                                                            <Icons.RefreshCcw />
                                                            Replace
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-foreground/40 p-5">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() =>
                                                            setIsSusCertificateSelectorOpen(
                                                                true
                                                            )
                                                        }
                                                        disabled={isPending}
                                                    >
                                                        <Icons.CloudUpload />
                                                        Upload Certificate
                                                    </Button>
                                                </div>
                                            )}
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-4 md:grid-cols-3">
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
                                                    categories.length === 0 ||
                                                    isPending
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {categories.map(
                                                        (category) => (
                                                            <SelectItem
                                                                key={
                                                                    category.id
                                                                }
                                                                value={
                                                                    category.id
                                                                }
                                                            >
                                                                {category.name}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="subcategoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subcategory</FormLabel>

                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={
                                                    getSubCategories(
                                                        form.watch("categoryId")
                                                    ).length === 0 || isPending
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select a subcategory" />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {getSubCategories(
                                                        form.watch("categoryId")
                                                    ).map((subCategory) => (
                                                        <SelectItem
                                                            key={subCategory.id}
                                                            value={
                                                                subCategory.id
                                                            }
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

                                <FormField
                                    control={form.control}
                                    name="productTypeId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Type</FormLabel>

                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={
                                                    getProductTypes(
                                                        form.watch(
                                                            "subcategoryId"
                                                        )
                                                    ).length === 0 || isPending
                                                }
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue placeholder="Select a product type" />
                                                    </SelectTrigger>
                                                </FormControl>

                                                <SelectContent>
                                                    {getProductTypes(
                                                        form.watch(
                                                            "subcategoryId"
                                                        )
                                                    ).map((productType) => (
                                                        <SelectItem
                                                            key={productType.id}
                                                            value={
                                                                productType.id
                                                            }
                                                        >
                                                            {productType.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="hidden">
                            <CardTitle>Product Has Variants</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4 p-4 md:p-6">
                            <FormField
                                control={form.control}
                                name="productHasVariants"
                                render={({ field }) => (
                                    <FormItem className="">
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                    disabled={isPending}
                                                />
                                            </FormControl>

                                            <FormLabel>
                                                This product has variants
                                            </FormLabel>
                                        </div>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {!form.watch("productHasVariants") ? (
                        <>
                            <Card>
                                <CardHeader className="p-4 md:p-6">
                                    <CardTitle className="text-lg font-medium">
                                        Pricing
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
                                    <div className="flex flex-col items-end gap-4 md:flex-row">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel>Price</FormLabel>

                                                    <FormControl>
                                                        <PriceInput
                                                            {...field}
                                                            currency="PAISE"
                                                            className="h-9"
                                                            value={
                                                                field.value ?? 0
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target.value.replace(
                                                                        /[^0-9]/g,
                                                                        ""
                                                                    );
                                                                field.onChange(
                                                                    value
                                                                );
                                                            }}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="compareAtPrice"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <div className="flex items-center gap-1">
                                                        <FormLabel>
                                                            Compare At Price
                                                        </FormLabel>

                                                        <TooltipProvider
                                                            delayDuration={0}
                                                        >
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <button>
                                                                        <Icons.CircleHelp className="size-4" />
                                                                    </button>
                                                                </TooltipTrigger>

                                                                <TooltipContent className="max-w-72">
                                                                    <p>
                                                                        To
                                                                        display
                                                                        a
                                                                        markdown,
                                                                        enter a
                                                                        value
                                                                        higher
                                                                        than
                                                                        your
                                                                        price.
                                                                        Often
                                                                        shown
                                                                        with a
                                                                        strikethrough.
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>

                                                    <FormControl>
                                                        <PriceInput
                                                            {...field}
                                                            currency="PAISE"
                                                            className="h-9"
                                                            value={
                                                                field.value ?? 0
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target.value.replace(
                                                                        /[^0-9]/g,
                                                                        ""
                                                                    );
                                                                field.onChange(
                                                                    value
                                                                );
                                                            }}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="flex flex-col items-end gap-4 md:flex-row">
                                        <FormField
                                            control={form.control}
                                            name="costPerItem"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel>
                                                        Cost Per Item
                                                    </FormLabel>

                                                    <FormControl>
                                                        <PriceInput
                                                            {...field}
                                                            currency="PAISE"
                                                            className="h-9"
                                                            value={
                                                                field.value ?? 0
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target.value.replace(
                                                                        /[^0-9]/g,
                                                                        ""
                                                                    );
                                                                field.onChange(
                                                                    value
                                                                );
                                                            }}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="w-full space-y-2">
                                            <Label>Profit</Label>

                                            <PriceInput
                                                currency="PAISE"
                                                className="h-9"
                                                value={profitOnItem}
                                                readOnly
                                                disabled={isPending}
                                            />
                                        </div>

                                        <div className="w-full space-y-2">
                                            <Label>Margin</Label>

                                            <PriceInput
                                                currency="%"
                                                className="h-9"
                                                value={marginOnItem}
                                                readOnly
                                                disabled={isPending}
                                            />
                                        </div>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        * Customer will not see the cost per
                                        item, profit or margin
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="p-4 md:p-6">
                                    <CardTitle className="text-lg font-medium">
                                        Inventory
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
                                    <div className="flex flex-col items-end gap-4 md:flex-row">
                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel>
                                                        Quantity
                                                    </FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="Quantity"
                                                            className="h-9"
                                                            value={
                                                                field.value ?? 0
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target.value.replace(
                                                                        /[^0-9]/g,
                                                                        ""
                                                                    );

                                                                field.onChange(
                                                                    value
                                                                );
                                                            }}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="sku"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel>SKU</FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="SKU"
                                                            className="h-9"
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="barcode"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormLabel>
                                                        Barcode
                                                    </FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="Barcode"
                                                            className="h-9"
                                                            value={
                                                                field.value ??
                                                                ""
                                                            }
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="p-4 md:p-6">
                                    <CardTitle className="text-lg font-medium">
                                        Shipping
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="weight"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Weight (g)
                                                    </FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="Weight"
                                                            className="h-9"
                                                            value={
                                                                field.value ?? 0
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target.value.replace(
                                                                        /[^0-9.]/g,
                                                                        ""
                                                                    );

                                                                field.onChange(
                                                                    value
                                                                );
                                                            }}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="length"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Length (cm)
                                                    </FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="Length"
                                                            className="h-9"
                                                            value={
                                                                field.value ?? 0
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target.value.replace(
                                                                        /[^0-9.]/g,
                                                                        ""
                                                                    );

                                                                field.onChange(
                                                                    value
                                                                );
                                                            }}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="width"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Width (cm)
                                                    </FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="Width"
                                                            className="h-9"
                                                            value={
                                                                field.value ?? 0
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target.value.replace(
                                                                        /[^0-9.]/g,
                                                                        ""
                                                                    );

                                                                field.onChange(
                                                                    value
                                                                );
                                                            }}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="height"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Height (cm)
                                                    </FormLabel>

                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="Height"
                                                            className="h-9"
                                                            value={
                                                                field.value ?? 0
                                                            }
                                                            onChange={(e) => {
                                                                const value =
                                                                    e.target.value.replace(
                                                                        /[^0-9.]/g,
                                                                        ""
                                                                    );

                                                                field.onChange(
                                                                    value
                                                                );
                                                            }}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>

                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator />

                                    <FormField
                                        control={form.control}
                                        name="originCountry"
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className="flex items-center gap-1">
                                                    <FormLabel>
                                                        Country/Region of origin
                                                    </FormLabel>

                                                    <TooltipProvider
                                                        delayDuration={0}
                                                    >
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <button>
                                                                    <Icons.CircleHelp className="size-4" />
                                                                </button>
                                                            </TooltipTrigger>

                                                            <TooltipContent className="max-w-72">
                                                                <p>
                                                                    In most
                                                                    cases, where
                                                                    the product
                                                                    was
                                                                    manufactured
                                                                    or
                                                                    assembled.
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>

                                                <FormControl>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value ?? ""
                                                        }
                                                        disabled={isPending}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Select a country" />
                                                            </SelectTrigger>
                                                        </FormControl>

                                                        <SelectContent>
                                                            {countries.map(
                                                                (country) => (
                                                                    <SelectItem
                                                                        key={
                                                                            country.isoCode
                                                                        }
                                                                        value={
                                                                            country.isoCode
                                                                        }
                                                                    >
                                                                        {
                                                                            country.name
                                                                        }
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="hsCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Harmonized System (HS) code
                                                </FormLabel>

                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Add HS code"
                                                        className="h-9"
                                                        value={
                                                            field.value ?? ""
                                                        }
                                                        disabled={isPending}
                                                    />
                                                </FormControl>

                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <ProductVariantManage
                            brandId={brandId}
                            brand={brand}
                            product={product}
                            media={media}
                            form={form}
                            appendOption={appendOption}
                            removeOption={removeOption}
                            replaceVariants={replaceVariants}
                            optionFields={optionFields}
                            variantFields={variantFields}
                            isPending={isPending}
                        />
                    )}

                    <Card>
                        <CardHeader className="p-4 md:p-6">
                            <CardTitle className="text-lg font-medium">
                                Search Engine Listing
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
                            <FormField
                                control={form.control}
                                name="metaTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Meta Title</FormLabel>

                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Enter product meta title"
                                                className="h-9"
                                                value={field.value ?? ""}
                                                disabled={isPending}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="metaDescription"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Meta Description</FormLabel>

                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Enter product meta description"
                                                minRows={5}
                                                value={field.value ?? ""}
                                                disabled={isPending}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="metaKeywords"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Meta Keywords</FormLabel>

                                        <FormControl>
                                            <TagInput
                                                {...field}
                                                tags={tags}
                                                setTags={(newTags) => {
                                                    setTags(newTags);
                                                    field.onChange(
                                                        (
                                                            newTags as [
                                                                Tag,
                                                                ...Tag[],
                                                            ]
                                                        ).map((tag) => tag.text)
                                                    );
                                                }}
                                                placeholder="Enter product meta keywords"
                                                styleClasses={{
                                                    inlineTagsContainer:
                                                        "border-input rounded-md bg-background ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 p-1 gap-1",
                                                    input: "w-full min-w-[80px] focus-visible:outline-none shadow-none px-2 h-7",
                                                    tag: {
                                                        body: "h-7 relative bg-background border border-input hover:bg-background rounded-sm font-medium text-xs ps-2 pe-7",
                                                        closeButton:
                                                            "absolute -inset-y-px -end-px p-0 rounded-e-lg flex size-7 transition-colors outline-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 text-muted-foreground/80 hover:text-foreground",
                                                    },
                                                }}
                                                activeTagIndex={activeTagIndex}
                                                setActiveTagIndex={
                                                    setActiveTagIndex
                                                }
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending || !form.formState.isDirty}
                    >
                        Save Product
                    </Button>
                </form>
            </Form>

            <MediaSelectModal
                brandId={brandId}
                allMedia={media}
                selectedMedia={selectedMedia}
                isOpen={isMediaSelectorOpen}
                setIsOpen={setIsMediaSelectorOpen}
                accept="image/*, video/*"
                multiple
                onSelectionComplete={(items) => {
                    form.setValue(
                        "media",
                        items.map((item, i) => ({
                            id: item.id,
                            position: i + 1,
                        })),
                        { shouldDirty: true }
                    );

                    setSelectedMedia(items);
                }}
            />

            <MediaSelectModal
                brandId={brandId}
                allMedia={docs}
                selectedMedia={
                    selectedSusCertificate ? [selectedSusCertificate] : []
                }
                isOpen={isSusCertificateSelectorOpen}
                setIsOpen={setIsSusCertificateSelectorOpen}
                accept="application/pdf"
                onSelectionComplete={(items) => {
                    const item = items[0];
                    if (!item) {
                        form.setValue("sustainabilityCertificate", null, {
                            shouldDirty: true,
                        });
                        setSelectedSusCertificate(null);
                        return;
                    }

                    form.setValue("sustainabilityCertificate", item.id, {
                        shouldDirty: true,
                    });
                    setSelectedSusCertificate(item);
                }}
            />
        </>
    );
}
