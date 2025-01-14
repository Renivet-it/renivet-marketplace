"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
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
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { TableCell, TableRow } from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
    BrandMediaItem,
    CreateProduct,
    ProductOption,
    ProductVariant,
    ProductVariantGroup,
} from "@/lib/validations";
import { Country } from "country-state-city";
import Image from "next/image";
import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { MediaSelectModal } from "../modals";

interface PageProps {
    brandId: string;
    media: BrandMediaItem[];
    form: UseFormReturn<CreateProduct>;
    group: ProductVariantGroup;
    selectedVariants: Set<string>;
    setSelectedVariants: Dispatch<SetStateAction<Set<string>>>;
    expandedGroups: Set<string>;
    setExpandedGroups: Dispatch<SetStateAction<Set<string>>>;
    currentValue: ProductOption["values"][number];
    groupBy: string;
    selectedMedia: BrandMediaItem | null;
    isPending: boolean;
}

export function ProductVariantGroupManageForm({
    brandId,
    media,
    form,
    group,
    selectedVariants,
    setSelectedVariants,
    expandedGroups,
    setExpandedGroups,
    currentValue,
    groupBy,
    selectedMedia: initialSelectedMedia,
    isPending,
}: PageProps) {
    const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<BrandMediaItem | null>(
        initialSelectedMedia
    );
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

    const options = form.watch("options");
    const variants = form.watch("variants");

    const toggleGroup = (groupKey: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupKey))
            // eslint-disable-next-line drizzle/enforce-delete-with-where
            newExpanded.delete(groupKey);
        else newExpanded.add(groupKey);

        setExpandedGroups(newExpanded);
    };

    const toggleGroupSelection = (group: ProductVariantGroup) => {
        const newSelected = new Set(selectedVariants);
        const allSelected = group.variants.every((variant) =>
            selectedVariants.has(variant.id)
        );
        const someSelected = group.variants.some((variant) =>
            selectedVariants.has(variant.id)
        );

        if (allSelected || someSelected)
            group.variants.forEach((variant) => {
                // eslint-disable-next-line drizzle/enforce-delete-with-where
                newSelected.delete(variant.id);
            });
        else
            group.variants.forEach((variant) => {
                newSelected.add(variant.id);
            });

        setSelectedVariants(newSelected);
    };

    const getUniqueImageCount = () => {
        const uniqueImages = new Set(
            group.variants
                .map((v) => variants.find((vx) => vx.id === v.id)?.image)
                .filter(Boolean)
        );
        return uniqueImages.size;
    };

    return (
        <React.Fragment key={group.key}>
            <TableRow key={`group-${group.key}`} className="bg-muted/50">
                <TableCell>
                    <Checkbox
                        checked={group.variants.every((v) =>
                            selectedVariants.has(v.id)
                        )}
                        onCheckedChange={() => toggleGroupSelection(group)}
                        disabled={isPending}
                    />
                </TableCell>

                <TableCell>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                type="button"
                                className="flex size-10 items-center justify-center overflow-hidden rounded-md border border-dashed border-primary text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => {
                                    setActiveVariantId(null);
                                    setIsMediaSelectorOpen(true);
                                }}
                                disabled={isPending}
                            >
                                {selectedMedia ? (
                                    <>
                                        <Image
                                            src={selectedMedia.url}
                                            alt={selectedMedia.name}
                                            width={40}
                                            height={40}
                                            className="rounded-md"
                                        />
                                        {getUniqueImageCount() > 1 && (
                                            <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                                {getUniqueImageCount()}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Icons.Image className="size-4" />
                                )}
                            </button>
                        </div>

                        <button
                            type="button"
                            className="group cursor-pointer space-y-1 text-start"
                            onClick={() => toggleGroup(group.key)}
                        >
                            <div className="font-medium">
                                {currentValue?.name}
                            </div>

                            <div className="flex items-center gap-2 whitespace-nowrap text-muted-foreground group-hover:underline">
                                <p>{group.variants.length} variants</p>

                                <Icons.ChevronDown
                                    className={cn(
                                        "size-4 transition-all ease-in-out",
                                        expandedGroups.has(group.key) &&
                                            "rotate-180"
                                    )}
                                />
                            </div>
                        </button>
                    </div>
                </TableCell>

                <TableCell>
                    <PriceInput
                        currency="PAISE"
                        className="h-9"
                        value={group.variants[0]?.price || 0}
                        disabled={
                            group.variants.some(
                                (variant) =>
                                    +variant.price !== +group.variants[0].price
                            ) || isPending
                        }
                        onChange={(e) => {
                            const price = parseInt(e.target.value) || 0;
                            group.variants.forEach((variant) => {
                                const index = variants.findIndex(
                                    (v) => v.id === variant.id
                                );
                                if (index !== -1)
                                    form.setValue(
                                        `variants.${index}.price`,
                                        price,
                                        {
                                            shouldDirty: true,
                                        }
                                    );
                            });
                        }}
                    />
                </TableCell>

                <TableCell>
                    <Input
                        value={group.variants.reduce(
                            (acc, variant) => acc + +variant.quantity,
                            0
                        )}
                        readOnly
                        disabled
                        className="h-9"
                        title="Quantity is automatically calculated based on the variants"
                        onChange={(e) => {
                            const quantity = parseInt(e.target.value);
                            group.variants.forEach((variant) => {
                                const index = variants.findIndex(
                                    (v) => v.id === variant.id
                                );
                                if (index !== -1)
                                    form.setValue(
                                        `variants.${index}.quantity`,
                                        quantity,
                                        {
                                            shouldDirty: true,
                                        }
                                    );
                            });
                        }}
                    />
                </TableCell>
            </TableRow>

            {expandedGroups.has(group.key) &&
                group.variants.map((variant) => {
                    const variantIndex = variants.findIndex(
                        (v) => v.id === variant.id
                    );
                    const variantMedia = media.find(
                        (m) => m.id === variants[variantIndex]?.image
                    );

                    return (
                        <ExpandedGroupRow
                            key={`variant-${variant.id}`}
                            variant={variant}
                            selectedVariants={selectedVariants}
                            setSelectedVariants={setSelectedVariants}
                            setActiveVariantId={setActiveVariantId}
                            variantIndex={variantIndex}
                            setIsMediaSelectorOpen={setIsMediaSelectorOpen}
                            variantMedia={variantMedia}
                            groupBy={groupBy}
                            options={options}
                            variants={variants}
                            form={form}
                            isPending={isPending}
                        />
                    );
                })}

            <MediaSelectModal
                brandId={brandId}
                allMedia={media}
                selectedMedia={selectedMedia ? [selectedMedia] : []}
                isOpen={isMediaSelectorOpen}
                setIsOpen={setIsMediaSelectorOpen}
                accept="image/*, video/*"
                onSelectionComplete={(items) => {
                    const item = items[0];

                    if (activeVariantId) {
                        const variantIndex = variants.findIndex(
                            (v) => v.id === activeVariantId
                        );
                        if (!item) {
                            form.setValue(
                                `variants.${variantIndex}.image`,
                                null
                            );
                            setSelectedMedia(null);
                            setActiveVariantId(null);
                            return;
                        }

                        if (variantIndex !== -1)
                            form.setValue(
                                `variants.${variantIndex}.image`,
                                item.id
                            );
                    } else {
                        group.variants.forEach((variant) => {
                            const variantIndex = variants.findIndex(
                                (v) => v.id === variant.id
                            );
                            if (!item) {
                                form.setValue(
                                    `variants.${variantIndex}.image`,
                                    null
                                );
                                setSelectedMedia(null);
                                setActiveVariantId(null);
                                return;
                            }

                            form.setValue(
                                `variants.${variantIndex}.image`,
                                item.id
                            );
                        });
                    }

                    setSelectedMedia(item);
                    setActiveVariantId(null);
                }}
            />
        </React.Fragment>
    );
}

interface ExpandedGroupRowProps {
    variant: ProductVariant;
    selectedVariants: Set<string>;
    setSelectedVariants: Dispatch<SetStateAction<Set<string>>>;
    setActiveVariantId: Dispatch<SetStateAction<string | null>>;
    variantIndex: number;
    setIsMediaSelectorOpen: Dispatch<SetStateAction<boolean>>;
    variantMedia?: BrandMediaItem;
    groupBy: string;
    options: ProductOption[];
    variants: ProductVariant[];
    form: UseFormReturn<CreateProduct>;
    isPending: boolean;
}

function ExpandedGroupRow({
    variant,
    selectedVariants,
    setSelectedVariants,
    setActiveVariantId,
    variantIndex,
    setIsMediaSelectorOpen,
    variantMedia,
    groupBy,
    options,
    variants,
    form,
    isPending,
}: ExpandedGroupRowProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const toggleVariantSelection = (variantId: string) => {
        const newSelected = new Set(selectedVariants);
        if (newSelected.has(variantId)) {
            // eslint-disable-next-line drizzle/enforce-delete-with-where
            newSelected.delete(variantId);
        } else {
            newSelected.add(variantId);
        }
        setSelectedVariants(newSelected);
    };

    const variantName = Object.entries(variant.combinations)
        .map(([key, value]) => {
            const option = options.find((o) => o.id === key);
            const optionValue = option?.values.find((v) => v.id === value);
            return optionValue?.name;
        })
        .filter(Boolean);

    const totalVariants = variants.length;

    const variantPrice = form.watch(`variants.${variantIndex}.price`);
    const variantCostPerItem = form.watch(
        `variants.${variantIndex}.costPerItem`
    );

    const profitOnItem = useMemo(() => {
        const priceInPaise = variantPrice;
        const costPerItemInPaise = variantCostPerItem;

        if (!priceInPaise || !costPerItemInPaise) return 0;

        return priceInPaise - costPerItemInPaise;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [variantPrice, variantCostPerItem]);

    const marginOnItem = useMemo(() => {
        const priceInPaise = variantPrice;
        const costPerItemInPaise = variantCostPerItem;

        if (!priceInPaise || !costPerItemInPaise) return 0;

        return +((profitOnItem / priceInPaise) * 100).toFixed(2);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profitOnItem]);

    const countries = useMemo(() => Country.getAllCountries(), []);

    const combinations = Object.entries(variant.combinations).filter(
        ([key]) => key !== groupBy
    );

    return (
        <>
            <TableRow key={`variant-${variant.id}`}>
                <TableCell>
                    <Checkbox
                        checked={selectedVariants.has(variant.id)}
                        onCheckedChange={() =>
                            toggleVariantSelection(variant.id)
                        }
                        disabled={isPending}
                    />
                </TableCell>

                <TableCell>
                    <div className="group flex items-center gap-2">
                        <button
                            type="button"
                            className="flex size-8 items-center justify-center overflow-hidden rounded-md border border-dashed border-primary text-primary disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => {
                                setActiveVariantId(variant.id);
                                setIsMediaSelectorOpen(true);
                            }}
                            disabled={isPending}
                        >
                            {variantMedia ? (
                                <Image
                                    src={variantMedia.url}
                                    alt={variantMedia.name}
                                    width={32}
                                    height={32}
                                    className="rounded-md"
                                />
                            ) : (
                                <Icons.Image className="size-4" />
                            )}
                        </button>

                        {combinations.length > 0 ? (
                            combinations.map(([key, value]) => (
                                <button
                                    type="button"
                                    key={key}
                                    className="group-hover:underline"
                                    onClick={() => setIsEditModalOpen(true)}
                                    disabled={isPending}
                                >
                                    {
                                        options
                                            .find((o) => o.id === key)
                                            ?.values.find((v) => v.id === value)
                                            ?.name
                                    }
                                </button>
                            ))
                        ) : (
                            <button
                                type="button"
                                className="text-muted-foreground group-hover:underline"
                                onClick={() => setIsEditModalOpen(true)}
                                disabled={isPending}
                            >
                                Single
                            </button>
                        )}
                    </div>
                </TableCell>

                <TableCell>
                    <FormField
                        control={form.control}
                        name={`variants.${variantIndex}.price`}
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <PriceInput
                                        {...field}
                                        className="h-9"
                                        currency="PAISE"
                                        onChange={(e) => {
                                            const value =
                                                e.target.value.replace(
                                                    /[^0-9]/g,
                                                    ""
                                                );
                                            field.onChange(value);
                                        }}
                                        disabled={isPending}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </TableCell>

                <TableCell>
                    <FormField
                        control={form.control}
                        name={`variants.${variantIndex}.quantity`}
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        {...field}
                                        className="h-9"
                                        onChange={(e) => {
                                            field.onChange(
                                                parseInt(e.target.value) || 0
                                            );
                                        }}
                                        disabled={isPending}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </TableCell>
            </TableRow>

            <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <SheetContent
                    className="h-screen space-y-4 overflow-auto sm:max-w-4xl [&>button]:hidden"
                    style={{
                        scrollbarWidth: "none",
                    }}
                >
                    <SheetHeader>
                        <SheetTitle>{variantName.join(" / ")}</SheetTitle>
                        <SheetDescription>
                            {totalVariants} variants
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-4">
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
                                        name={`variants.${variantIndex}.price`}
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Price</FormLabel>

                                                <FormControl>
                                                    <PriceInput
                                                        {...field}
                                                        currency="PAISE"
                                                        className="h-9"
                                                        value={field.value ?? 0}
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
                                        name={`variants.${variantIndex}.compareAtPrice`}
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
                                                                    To display a
                                                                    markdown,
                                                                    enter a
                                                                    value higher
                                                                    than your
                                                                    price. Often
                                                                    shown with a
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
                                                        value={field.value ?? 0}
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
                                        name={`variants.${variantIndex}.costPerItem`}
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
                                                        value={field.value ?? 0}
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
                                    * Customer will not see the cost per item,
                                    profit or margin
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
                                        name={`variants.${variantIndex}.quantity`}
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Quantity</FormLabel>

                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Quantity"
                                                        className="h-9"
                                                        value={field.value ?? 0}
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
                                        name={`variants.${variantIndex}.sku`}
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>SKU</FormLabel>

                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="SKU"
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

                                    <FormField
                                        control={form.control}
                                        name={`variants.${variantIndex}.barcode`}
                                        render={({ field }) => (
                                            <FormItem className="w-full">
                                                <FormLabel>Barcode</FormLabel>

                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Barcode"
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
                                        name={`variants.${variantIndex}.weight`}
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
                                                        value={field.value ?? 0}
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
                                        name={`variants.${variantIndex}.length`}
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
                                                        value={field.value ?? 0}
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
                                        name={`variants.${variantIndex}.width`}
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
                                                        value={field.value ?? 0}
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
                                        name={`variants.${variantIndex}.height`}
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
                                                        value={field.value ?? 0}
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
                                    name={`variants.${variantIndex}.originCountry`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center gap-1">
                                                <FormLabel>
                                                    Country Code (ISO)
                                                </FormLabel>

                                                <TooltipProvider
                                                    delayDuration={0}
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button>
                                                                <Icons.CircleHelp className="size-4" />
                                                            </button>
                                                        </TooltipTrigger>

                                                        <TooltipContent className="max-w-72">
                                                            <p>
                                                                Enter the
                                                                two-letter ISO
                                                                country code
                                                                (e.g., US for
                                                                United States,
                                                                IN for India).
                                                                This is where
                                                                the product was
                                                                manufactured or
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
                                                            <SelectValue placeholder="Select a country code" />
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
                                                                    }{" "}
                                                                    -{" "}
                                                                    {
                                                                        country.isoCode
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
                                                    value={field.value ?? ""}
                                                    disabled={isPending}
                                                />
                                            </FormControl>

                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <SheetFooter>
                        <SheetClose asChild>
                            <Button type="button" className="h-9 w-full">
                                Done
                            </Button>
                        </SheetClose>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
