"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { trpc } from "@/lib/trpc/client";
import {
    convertPriceToPaise,
    generateSKU,
    handleClientError,
    slugify,
    wait,
} from "@/lib/utils";
import {
    CachedBrand,
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
    CreateProduct,
} from "@/lib/validations";
import { useMutation } from "@tanstack/react-query";
import { parse } from "papaparse";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface PageProps {
    brands: CachedBrand[];
    categories: CachedCategory[];
    subcategories: CachedSubCategory[];
    productTypes: CachedProductType[];
}

interface ImportRow {
    "Product Title": string;
    "Product Description (HTML)": string;
    "Meta Title": string;
    "Meta Description": string;
    "Meta Keywords": string;
    "Has Variants": string;
    Category: string;
    Subcategory: string;
    "Product Type": string;
    "Option1 Name": string;
    "Option1 Value": string;
    "Option2 Name": string;
    "Option2 Value": string;
    "Option3 Name": string;
    "Option3 Value": string;
    SKU: string;
    Barcode: string;
    "Price (in Rupees)": string;
    "Compare At Price (in Rupees)": string;
    "Cost Per Item (in Rupees)": string;
    Quantity: string;
    "Weight (g)": string;
    "Length (cm)": string;
    "Width (cm)": string;
    "Height (cm)": string;
    "Country Code (ISO)": string;
    "HS Code": string;
}

export function ProductAddAdminModal({
    brands,
    categories,
    subcategories,
    productTypes,
}: PageProps) {
    const fileInputRef = useRef<HTMLInputElement>(null!);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [brandId, setBrandId] = useState<string | null>(null);
    const [brandName, setBrandName] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (isAddModalOpen) {
            setBrandId(null);
            setBrandName(null);
            setFile(null);
        }
    }, [isAddModalOpen]);

    const { mutateAsync: importProuductsAsync } =
        trpc.general.productReviews.addBulkProducts.useMutation();

    const { mutate: createBulkProducts, isPending: isCreating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Importing products...");
            return { toastId };
        },
        mutationFn: async (products: CreateProduct[]) => {
            if (!products.length) throw new Error("No products to import");
            await importProuductsAsync({
                brandId: brandId!,
                products,
            });
        },
        onSuccess: (_, __, { toastId }) => {
            setIsAddModalOpen(false);
            window.location.reload();
            return toast.success("Imported products successfully", {
                id: toastId,
            });
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const processFile = (file: File) => {
        parse<ImportRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const toastId = toast.loading("Processing file...");

                try {
                    const productGroups = new Map<string, ImportRow[]>();

                    results.data = results.data.filter((row) => {
                        return row["Product Title"]?.trim();
                    });

                    results.data.forEach((row) => {
                        const title = row["Product Title"];
                        if (!productGroups.has(title)) {
                            productGroups.set(title, []);
                        }
                        productGroups.get(title)?.push(row);
                    });

                    const products: CreateProduct[] = [];

                    for (const [title, rows] of productGroups) {
                        const firstRow = rows[0];
                        const hasVariants =
                            firstRow["Has Variants"].toLowerCase() === "true";

                        const category = findCategory(
                            firstRow.Category,
                            categories
                        );
                        const subcategory = findSubcategory(
                            firstRow.Subcategory,
                            firstRow.Category,
                            categories,
                            subcategories
                        );
                        const productType = findProductType(
                            firstRow["Product Type"],
                            firstRow.Subcategory,
                            firstRow.Category,
                            categories,
                            subcategories,
                            productTypes
                        );

                        const product: CreateProduct = {
                            brandId: brandId!,
                            title,
                            description:
                                firstRow["Product Description (HTML)"] || "",
                            metaTitle: firstRow["Meta Title"] || "",
                            metaDescription: firstRow["Meta Description"] || "",
                            metaKeywords:
                                firstRow["Meta Keywords"]
                                    ?.split(",")
                                    .map((k) => k.trim())
                                    .filter(Boolean) || [],
                            categoryId: category.id,
                            subcategoryId: subcategory.id,
                            productTypeId: productType.id,
                            productHasVariants: hasVariants,
                            barcode: null,
                            price: 0,
                            compareAtPrice: null,
                            costPerItem: null,
                            height: 0,
                            hsCode: null,
                            length: 0,
                            media: [],
                            nativeSku: generateSKU({
                                brand: {
                                    name: brandName!,
                                    id: brandId!,
                                },
                                category: category.name,
                                subcategory: subcategory.name,
                                productType: productType.name,
                            }),
                            options: [],
                            originCountry: null,
                            quantity: 0,
                            sku: null,
                            sustainabilityCertificate: null,
                            variants: [],
                            weight: 0,
                            width: 0,
                        };

                        if (!hasVariants) {
                            product.sku = firstRow.SKU || "";
                            product.barcode = firstRow.Barcode || null;
                            product.price = convertPriceToPaise(
                                parseFloat(firstRow["Price (in Rupees)"]) || 0
                            );
                            product.compareAtPrice =
                                convertPriceToPaise(
                                    parseFloat(
                                        firstRow["Compare At Price (in Rupees)"]
                                    ) || 0
                                ) || null;
                            product.costPerItem =
                                convertPriceToPaise(
                                    parseFloat(
                                        firstRow["Cost Per Item (in Rupees)"]
                                    ) || 0
                                ) || null;
                            product.quantity = parseInt(firstRow.Quantity) || 0;
                            product.weight =
                                parseInt(firstRow["Weight (g)"]) || 0;
                            product.length =
                                parseInt(firstRow["Length (cm)"]) || 0;
                            product.width =
                                parseInt(firstRow["Width (cm)"]) || 0;
                            product.height =
                                parseInt(firstRow["Height (cm)"]) || 0;
                            product.originCountry =
                                firstRow["Country Code (ISO)"] || null;
                            product.hsCode = firstRow["HS Code"] || null;
                        } else {
                            const optionsMap = new Map<string, Set<string>>();

                            for (const row of rows) {
                                for (let i = 1; i <= 3; i++) {
                                    const name =
                                        row[
                                            `Option${i} Name` as keyof ImportRow
                                        ];
                                    const value =
                                        row[
                                            `Option${i} Value` as keyof ImportRow
                                        ];
                                    if (name && value) {
                                        if (!optionsMap.has(name)) {
                                            optionsMap.set(name, new Set());
                                        }
                                        optionsMap.get(name)?.add(value);
                                    }
                                }
                            }

                            product.options = Array.from(
                                optionsMap.entries()
                            ).map(([name, values], index) => ({
                                id: crypto.randomUUID(),
                                productId: crypto.randomUUID(),
                                name,
                                position: index,
                                values: Array.from(values).map(
                                    (value, vIndex) => ({
                                        id: crypto.randomUUID(),
                                        name: value,
                                        position: vIndex,
                                    })
                                ),
                                isDeleted: false,
                                deletedAt: null,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }));

                            product.variants = rows.map((row) => {
                                const combinations = product.options!.reduce(
                                    (acc, option) => {
                                        const valueForThisOption =
                                            row[
                                                `Option${option.position + 1} Value` as keyof ImportRow
                                            ];
                                        const optionValue = option.values.find(
                                            (v) => v.name === valueForThisOption
                                        );

                                        if (optionValue) {
                                            acc[option.id] = optionValue.id;
                                        }
                                        return acc;
                                    },
                                    {} as Record<string, string>
                                );

                                const optionCombinations = product.options!.map(
                                    (option) => {
                                        const valueForThisOption =
                                            row[
                                                `Option${option.position + 1} Value` as keyof ImportRow
                                            ];
                                        return {
                                            name: option.name,
                                            value: valueForThisOption || "",
                                        };
                                    }
                                );

                                return {
                                    id: crypto.randomUUID(),
                                    productId: crypto.randomUUID(),
                                    combinations,
                                    nativeSku: generateSKU({
                                        brand: {
                                            name: brandName!,
                                            id: brandId!,
                                        },
                                        category: category.name,
                                        subcategory: subcategory.name,
                                        productType: productType.name,
                                        options: optionCombinations,
                                    }),
                                    sku: row.SKU,
                                    barcode: row.Barcode || null,
                                    price:
                                        convertPriceToPaise(
                                            parseFloat(
                                                row["Price (in Rupees)"]
                                            ) || 0
                                        ) || 0,
                                    compareAtPrice:
                                        convertPriceToPaise(
                                            parseFloat(
                                                row[
                                                    "Compare At Price (in Rupees)"
                                                ]
                                            ) || 0
                                        ) || null,
                                    costPerItem:
                                        convertPriceToPaise(
                                            parseFloat(
                                                row["Cost Per Item (in Rupees)"]
                                            ) || 0
                                        ) || null,
                                    quantity: parseInt(row.Quantity) || 0,
                                    weight: parseInt(row["Weight (g)"]) || 0,
                                    length: parseInt(row["Length (cm)"]) || 0,
                                    width: parseInt(row["Width (cm)"]) || 0,
                                    height: parseInt(row["Height (cm)"]) || 0,
                                    originCountry:
                                        row["Country Code (ISO)"] || null,
                                    hsCode: row["HS Code"] || null,
                                    image: null,
                                    isDeleted: false,
                                    deletedAt: null,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                };
                            });
                        }

                        products.push(product);
                    }

                    toast.success("File processed successfully", {
                        id: toastId,
                    });
                    await wait(1000);
                    createBulkProducts(products);
                } catch (error) {
                    return handleClientError(error, toastId);
                }
            },
        });
    };

    const findCategory = (
        categoryName: string,
        categories: CachedCategory[]
    ) => {
        const category = categories.find(
            (c) => slugify(c.name) === slugify(categoryName)
        );
        if (!category) throw new Error(`Category not found: ${categoryName}`);
        return category;
    };

    const findSubcategory = (
        subcategoryName: string,
        categoryName: string,
        categories: CachedCategory[],
        subcategories: CachedSubCategory[]
    ) => {
        const category = categories.find(
            (c) => slugify(c.name) === slugify(categoryName)
        );
        if (!category) throw new Error(`Category not found: ${categoryName}`);

        const subcategory = subcategories.find(
            (sc) =>
                slugify(sc.name) === slugify(subcategoryName) &&
                sc.categoryId === category.id
        );
        if (!subcategory)
            throw new Error(
                `Subcategory not found: ${subcategoryName} under category ${categoryName}`
            );

        return subcategory;
    };

    const findProductType = (
        productTypeName: string,
        subcategoryName: string,
        categoryName: string,
        categories: CachedCategory[],
        subcategories: CachedSubCategory[],
        productTypes: CachedProductType[]
    ) => {
        const category = categories.find(
            (c) => slugify(c.name) === slugify(categoryName)
        );
        if (!category) throw new Error(`Category not found: ${categoryName}`);

        const subcategory = subcategories.find(
            (sc) =>
                slugify(sc.name) === slugify(subcategoryName) &&
                sc.categoryId === category.id
        );
        if (!subcategory)
            throw new Error(
                `Subcategory not found: ${subcategoryName} under category ${categoryName}`
            );

        const productType = productTypes.find(
            (pt) =>
                slugify(pt.name) === slugify(productTypeName) &&
                pt.categoryId === category.id &&
                pt.subCategoryId === subcategory.id
        );
        if (!productType)
            throw new Error(
                `Product type not found: ${productTypeName} under subcategory ${subcategoryName}`
            );

        return productType;
    };

    const handleFileUpload = () => {
        if (!brandName || !brandId || !file)
            return toast.error("All fields are required");

        processFile(file);
    };

    return (
        <>
            <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsAddModalOpen(true)}
            >
                <Icons.Plus />
                Add Products
            </Button>

            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Products</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="brandId">Brand</Label>

                            <Select
                                value={brandId ?? ""}
                                onValueChange={(value) => {
                                    setBrandId(value);
                                    const brand = brands.find(
                                        (b) => b.id === value
                                    );
                                    if (brand) setBrandName(brand.name);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a brand" />
                                </SelectTrigger>

                                <SelectContent>
                                    {brands.map((brand) => (
                                        <SelectItem
                                            key={brand.id}
                                            value={brand.id}
                                        >
                                            {brand.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="products_file">File</Label>

                            <input
                                ref={fileInputRef}
                                type="file"
                                id="products_file"
                                className="hidden h-9"
                                accept=".csv"
                                onChange={(e) =>
                                    setFile(e.target.files?.[0] ?? null)
                                }
                            />

                            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input p-2">
                                <Button
                                    variant="outline"
                                    className="h-8 text-xs"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <Icons.Upload />
                                    {file ? "Change file" : "Upload file"}
                                </Button>

                                {file ? (
                                    <span className="text-sm">{file.name}</span>
                                ) : (
                                    <span className="text-sm">
                                        No file selected
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            className="h-9 w-full"
                            disabled={
                                !brandId || !brandName || !file || isCreating
                            }
                            onClick={handleFileUpload}
                        >
                            Process
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
