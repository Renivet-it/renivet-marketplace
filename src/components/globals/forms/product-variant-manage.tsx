"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input-dash";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { generateCombinations, generateSKU, groupVariants } from "@/lib/utils";
import {
    BrandMediaItem,
    CachedBrand,
    CreateProduct,
    ProductWithBrand,
} from "@/lib/validations";
import { parse, unparse } from "papaparse";
import { useEffect, useRef, useState } from "react";
import {
    FieldArrayWithId,
    UseFieldArrayAppend,
    UseFieldArrayRemove,
    UseFieldArrayReplace,
    UseFormReturn,
} from "react-hook-form";
import { toast } from "sonner";
import { ProductVariantGroupManageForm } from "./product-variant-group-manage";

interface PageProps {
    brandId: string;
    product?: ProductWithBrand;
    brand: CachedBrand;
    media: BrandMediaItem[];
    form: UseFormReturn<CreateProduct>;
    appendOption: UseFieldArrayAppend<CreateProduct, "options">;
    removeOption: UseFieldArrayRemove;
    replaceVariants: UseFieldArrayReplace<CreateProduct, "variants">;
    optionFields: FieldArrayWithId<CreateProduct, "options", "id">[];
    variantFields: FieldArrayWithId<CreateProduct, "variants", "id">[];
    isPending: boolean;
}

export function ProductVariantManage({
    brandId,
    product,
    brand,
    media,
    form,
    appendOption,
    removeOption,
    replaceVariants,
    optionFields,
    variantFields,
    isPending,
}: PageProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set()
    );
    const [groupBy, setGroupBy] = useState<string>("");
    const [selectedVariants, setSelectedVariants] = useState<Set<string>>(
        new Set()
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const options = form.watch("options");
    const variants = form.watch("variants");

    useEffect(() => {
        if (options.length > 0 && !groupBy) setGroupBy(options[0].id);
    }, [options, groupBy]);

    const addOption = () => {
        appendOption({
            id: crypto.randomUUID(),
            productId: product?.id ?? crypto.randomUUID(),
            name: "",
            values: [],
            position: options.length,
            isDeleted: false,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };

    const addOptionValue = (optionIndex: number, value: string) => {
        const newValues = [
            ...options[optionIndex].values,
            {
                id: crypto.randomUUID(),
                name: value,
                position: options[optionIndex].values.length,
            },
        ];
        form.setValue(`options.${optionIndex}.values`, newValues);
    };

    const removeOptionValue = (optionIndex: number, valueId: string) => {
        const newValues = options[optionIndex].values.filter(
            (v) => v.id !== valueId
        );
        form.setValue(`options.${optionIndex}.values`, newValues);
    };

    const generateVariants = () => {
        const combinations = generateCombinations(options);
        const newVariants = combinations.map((combo) => {
            const existingVariant = variants.find((variant) =>
                Object.entries(combo).every(
                    ([key, value]) => variant.combinations[key] === value
                )
            );

            if (existingVariant) {
                return {
                    ...existingVariant,
                    combinations: {
                        ...existingVariant.combinations,
                        ...combo,
                    },
                };
            }

            return {
                id: crypto.randomUUID(),
                productId:
                    product?.id || options[0]?.productId || crypto.randomUUID(),
                combinations: combo,
                price: 0,
                compareAtPrice: null,
                costPerItem: null,
                quantity: 0,
                nativeSku: generateSKU({ brand }),
                sku: "",
                barcode: null,
                image: null,
                weight: 0,
                length: 0,
                width: 0,
                height: 0,
                originCountry: null,
                hsCode: null,
                isDeleted: false,
                deletedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        });

        replaceVariants(newVariants);
    };

    const toggleAllVariants = (checked: boolean) => {
        const newSelected = new Set<string>();
        if (checked) {
            variants.forEach((variant) => {
                newSelected.add(variant.id);
            });
        }
        setSelectedVariants(newSelected);
    };

    const handleExportVariants = () => {
        if (selectedVariants.size === 0)
            return toast.error("Please select at least one variant to export");

        const selectedVariantsData = variants
            .filter((variant) => selectedVariants.has(variant.id))
            .map((variant) => {
                const optionColumns = Object.entries(
                    variant.combinations
                ).reduce(
                    (acc, [key, value]) => {
                        const option = options.find((o) => o.id === key);
                        const optionValue = option?.values.find(
                            (v) => v.id === value
                        );
                        acc[`${option?.name} (DO NOT FILL)`] =
                            optionValue?.name || "";
                        return acc;
                    },
                    {} as Record<string, string>
                );

                return {
                    ...optionColumns,
                    "Price (in Rupees)": variant.price,
                    "Compare At Price (in Rupees)":
                        variant.compareAtPrice || "",
                    "Cost Per Item (in Rupees)": variant.costPerItem || "",
                    SKU: variant.sku || "",
                    Barcode: variant.barcode || "",
                    Quantity: variant.quantity,
                    "Weight (g)": variant.weight,
                    "Length (cm)": variant.length,
                    "Width (cm)": variant.width,
                    "Height (cm)": variant.height,
                    "Country Code (ISO)": variant.originCountry || "",
                    "HS Code": variant.hsCode || "",
                };
            });

        try {
            const csv = unparse(selectedVariantsData, {
                quotes: true,
                header: true,
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `variants_${new Date().toISOString().split("T")[0]}_${Date.now()}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            toast.success(
                `Successfully exported ${selectedVariants.size} variants`
            );
        } catch (error) {
            toast.error("Failed to export variants");
            console.error(error);
        }
    };

    const handleImportVariants = () => {
        fileInputRef.current?.click();
    };

    const totalStock = variants.reduce(
        (acc, variant) => acc + variant.quantity,
        0
    );

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const csvData = event.target?.result as string;

            parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        const updatedVariants = variants.map((variant) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const csvRow = results.data.find((row: any) => {
                                return Object.entries(
                                    variant.combinations
                                ).every(([optionId, valueId]) => {
                                    const option = options.find(
                                        (opt) => opt.id === optionId
                                    );
                                    const value = option?.values.find(
                                        (val) => val.id === valueId
                                    );
                                    const columnName = `${option?.name} (DO NOT FILL)`;
                                    return row[columnName] === value?.name;
                                });
                            }) as Record<string, string>;

                            if (!csvRow) return variant;

                            return {
                                ...variant,
                                price: csvRow["Price (in Rupees)"]
                                    ? parseFloat(csvRow["Price (in Rupees)"])
                                    : variant.price,
                                compareAtPrice: csvRow[
                                    "Compare At Price (in Paise)"
                                ]
                                    ? parseFloat(
                                          csvRow["Compare At Price (in Rupees)"]
                                      )
                                    : variant.compareAtPrice,
                                costPerItem: csvRow["Cost Per Item (in Paise)"]
                                    ? parseFloat(
                                          csvRow["Cost Per Item (in Paise)"]
                                      )
                                    : variant.costPerItem,
                                sku: csvRow["SKU"] || variant.sku,
                                barcode: csvRow["Barcode"] || variant.barcode,
                                quantity: csvRow["Quantity"]
                                    ? Number(csvRow["Quantity"])
                                    : variant.quantity,
                                weight: csvRow["Weight (g)"]
                                    ? Number(csvRow["Weight (g)"])
                                    : variant.weight,
                                length: csvRow["Length (cm)"]
                                    ? Number(csvRow["Length (cm)"])
                                    : variant.length,
                                width: csvRow["Width (cm)"]
                                    ? Number(csvRow["Width (cm)"])
                                    : variant.width,
                                height: csvRow["Height (cm)"]
                                    ? Number(csvRow["Height (cm)"])
                                    : variant.height,
                                originCountry:
                                    csvRow["Country Code (ISO)"] ||
                                    variant.originCountry,
                                hsCode: csvRow["HS Code"] || variant.hsCode,
                            };
                        });

                        replaceVariants(updatedVariants);
                        toast.success("Variants imported successfully");
                    } catch (error) {
                        console.error(error);
                        toast.error(
                            "Failed to import variants. Please check the CSV format"
                        );
                    }
                },
                error: () => {
                    toast.error("Failed to parse CSV file");
                },
            });
        };

        reader.readAsText(file);
        e.target.value = "";
    };

    const variantGroups = groupVariants(variants, groupBy);

    return (
        <>
            <Card>
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="text-lg font-medium">
                        Variants
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 p-4 pt-0 md:p-6 md:pt-0">
                    {options.length === 0 ? (
                        <button
                            type="button"
                            className="flex items-center gap-2 rounded-md p-1 px-2 text-sm font-medium transition-all ease-in-out hover:bg-muted"
                            onClick={addOption}
                            disabled={isPending}
                        >
                            <Icons.PlusCircle className="size-4" />
                            Add options like size or color
                        </button>
                    ) : (
                        <div className="space-y-4">
                            {optionFields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="space-y-4 rounded-lg border p-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`options.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="'Size', 'Color', etc."
                                                            className="h-9"
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key ===
                                                                    "Enter"
                                                                )
                                                                    e.preventDefault();
                                                            }}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-9"
                                            onClick={() => removeOption(index)}
                                            disabled={isPending}
                                        >
                                            <span className="sr-only">
                                                Remove option
                                            </span>
                                            <Icons.Trash2 className="size-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {options[index]?.values.map(
                                            (value, valueIndex) => (
                                                <div
                                                    key={value.id}
                                                    className="flex items-center gap-2"
                                                >
                                                    <div className="flex size-9 items-center justify-center text-sm font-medium">
                                                        {valueIndex + 1}.
                                                    </div>

                                                    <FormField
                                                        control={form.control}
                                                        name={`options.${index}.values.${valueIndex}.name`}
                                                        render={({ field }) => (
                                                            <FormItem className="w-full">
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        className="h-9"
                                                                        onKeyDown={(
                                                                            e
                                                                        ) => {
                                                                            if (
                                                                                e.key ===
                                                                                "Enter"
                                                                            )
                                                                                e.preventDefault();
                                                                        }}
                                                                        disabled={
                                                                            isPending
                                                                        }
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="size-9"
                                                        size="icon"
                                                        onClick={() =>
                                                            removeOptionValue(
                                                                index,
                                                                value.id
                                                            )
                                                        }
                                                        disabled={isPending}
                                                    >
                                                        <Icons.Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            )
                                        )}

                                        <div className="flex items-center gap-2">
                                            <div className="flex size-9 items-center justify-center text-sm font-medium">
                                                {options[index]?.values.length +
                                                    1}
                                                .
                                            </div>

                                            <Input
                                                placeholder="'Small', 'Red', etc."
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === "Enter" &&
                                                        e.currentTarget.value
                                                    ) {
                                                        e.preventDefault();
                                                        addOptionValue(
                                                            index,
                                                            e.currentTarget
                                                                .value
                                                        );
                                                        e.currentTarget.value =
                                                            "";
                                                    }
                                                }}
                                                className="h-9"
                                                disabled={isPending}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center justify-between gap-2">
                                <Button
                                    type="button"
                                    onClick={addOption}
                                    variant="outline"
                                    className="h-9"
                                    disabled={isPending}
                                >
                                    <Icons.Plus className="size-4" />
                                    Add another option
                                </Button>

                                <Button
                                    type="button"
                                    onClick={generateVariants}
                                    className="h-9"
                                    disabled={isPending}
                                >
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}

                    {variantFields.length > 0 && <Separator />}

                    {variantFields.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                <div className="flex flex-col items-center gap-4 md:flex-row md:gap-2">
                                    <Select
                                        value={groupBy}
                                        onValueChange={setGroupBy}
                                        disabled={isPending}
                                    >
                                        <SelectTrigger className="h-8 md:w-[180px]">
                                            <SelectValue placeholder="Group by..." />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {options.map((option) => (
                                                <SelectItem
                                                    key={option.id}
                                                    value={option.id}
                                                    className="py-1"
                                                >
                                                    Group by {option.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <p className="text-sm text-muted-foreground">
                                        Click on the variants to add details
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-8 w-full md:w-auto"
                                        disabled={
                                            selectedVariants.size === 0 ||
                                            isPending
                                        }
                                        onClick={handleExportVariants}
                                    >
                                        <Icons.Upload />
                                        Export ({selectedVariants.size})
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-8 w-full md:w-auto"
                                        onClick={handleImportVariants}
                                        disabled={isPending}
                                    >
                                        <Icons.Download />
                                        Import
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className="text-sm text-primary hover:underline"
                                    onClick={() =>
                                        setExpandedGroups((prevState) => {
                                            if (
                                                prevState.size ===
                                                variantGroups.length
                                            )
                                                return new Set();

                                            return new Set(
                                                variantGroups.map(
                                                    (group) => group.key
                                                )
                                            );
                                        })
                                    }
                                >
                                    {expandedGroups.size ===
                                    variantGroups.length
                                        ? "Collapse all"
                                        : "Expand all"}
                                </button>
                            </div>

                            <Table className="border">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Checkbox
                                                checked={
                                                    variants.length > 0 &&
                                                    variants.every((variant) =>
                                                        selectedVariants.has(
                                                            variant.id
                                                        )
                                                    )
                                                }
                                                onCheckedChange={
                                                    toggleAllVariants
                                                }
                                                disabled={isPending}
                                            />
                                        </TableHead>
                                        <TableHead>Variant</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Compare At</TableHead>
                                        <TableHead>Available</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {variantGroups.map((group) => {
                                        const currentOption = options.find(
                                            (o) => o.id === groupBy
                                        );

                                        const currentValue =
                                            currentOption?.values.find(
                                                (v) => v.id === group.key
                                            );
                                        if (!currentValue) return null;

                                        const variantMedia = (() => {
                                            const imageIds = new Set(
                                                group.variants
                                                    .map(
                                                        (v) =>
                                                            variants.find(
                                                                (vx) =>
                                                                    vx.id ===
                                                                    v.id
                                                            )?.image
                                                    )
                                                    .filter(Boolean)
                                            );

                                            if (imageIds.size === 1) {
                                                const imageId =
                                                    Array.from(imageIds)[0];
                                                return media.find(
                                                    (m) => m.id === imageId
                                                );
                                            }

                                            return null;
                                        })();

                                        return (
                                            <ProductVariantGroupManageForm
                                                key={group.key}
                                                brandId={brandId}
                                                media={media}
                                                selectedMedia={
                                                    variantMedia || null
                                                }
                                                currentValue={currentValue}
                                                expandedGroups={expandedGroups}
                                                form={form}
                                                group={group}
                                                groupBy={groupBy}
                                                selectedVariants={
                                                    selectedVariants
                                                }
                                                setExpandedGroups={
                                                    setExpandedGroups
                                                }
                                                setSelectedVariants={
                                                    setSelectedVariants
                                                }
                                                isPending={isPending}
                                            />
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="justify-center text-center">
                    <p className="text-sm">Total stock: {totalStock}</p>
                </CardFooter>
            </Card>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleFileUpload}
            />
        </>
    );
}
