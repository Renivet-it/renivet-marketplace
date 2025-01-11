"use client";

import { Icons } from "@/components/icons";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import { generateSKU, handleClientError, slugify, wait } from "@/lib/utils";
import {
    CachedBrand,
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
    CreateProduct,
} from "@/lib/validations";
import { useMutation } from "@tanstack/react-query";
import { parseAsInteger, useQueryState } from "nuqs";
import { parse } from "papaparse";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface PageProps {
    brand: CachedBrand;
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
    "Price (in Paise)": string;
    "Compare At Price (in Paise)": string;
    "Cost Per Item (in Paise)": string;
    Quantity: string;
    "Weight (g)": string;
    "Length (cm)": string;
    "Width (cm)": string;
    "Height (cm)": string;
    "Country Code (ISO)": string;
    "HS Code": string;
}

export function ProductImportButton({
    brand,
    categories,
    subcategories,
    productTypes,
}: PageProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [products, setProducts] = useState<CreateProduct[]>([]);

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });

    const { refetch } = trpc.brands.products.getProducts.useQuery({
        brandIds: [brand.id],
        limit,
        page,
        search,
    });

    const { mutateAsync: importProuductsAsync } =
        trpc.brands.products.bulkCreateProducts.useMutation();

    const { mutate: createBulkProducts, isPending: isCreating } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Importing products...");
            return { toastId };
        },
        mutationFn: async () => {
            if (!products.length) throw new Error("No products to import");
            await importProuductsAsync(products);
        },
        onSuccess: (_, __, { toastId }) => {
            refetch();
            return toast.success("Imported products successfully", {
                id: toastId,
            });
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

    const { mutate: processFile, isPending: isProcessing } = useMutation({
        onMutate: () => {
            const toastId = toast.loading("Processing file...");
            return { toastId };
        },
        mutationFn: async (file: File) => {
            parse<ImportRow>(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
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
                            brandId: brand.id,
                            title,
                            description:
                                firstRow["Product Description (HTML)"] || "", // Updated field name
                            metaTitle: firstRow["Meta Title"] || "",
                            metaDescription: firstRow["Meta Description"] || "",
                            metaKeywords:
                                firstRow["Meta Keywords"]
                                    ?.split(",")
                                    .map((k) => k.trim()) || [],
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
                            nativeSku: !hasVariants
                                ? generateSKU({
                                      brand,
                                      category: category.name,
                                      subcategory: subcategory.name,
                                      productType: productType.name,
                                  })
                                : null,
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
                            product.price =
                                parseInt(firstRow["Price (in Paise)"]) || 0;
                            product.compareAtPrice =
                                parseInt(
                                    firstRow["Compare At Price (in Paise)"]
                                ) || null;
                            product.costPerItem =
                                parseInt(
                                    firstRow["Cost Per Item (in Paise)"]
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
                                productId: crypto.randomUUID(), // Temporary ID
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
                                // Get combinations for this specific row
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

                                // Get option combinations for SKU generation
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
                                        brand,
                                        category: category.name,
                                        subcategory: subcategory.name,
                                        productType: productType.name,
                                        options: optionCombinations,
                                    }),
                                    sku: row.SKU,
                                    barcode: row.Barcode || null,
                                    price:
                                        parseInt(row["Price (in Paise)"]) || 0,
                                    compareAtPrice:
                                        parseInt(
                                            row["Compare At Price (in Paise)"]
                                        ) || null,
                                    costPerItem:
                                        parseInt(
                                            row["Cost Per Item (in Paise)"]
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

                    setProducts(products);
                },
                error: (error) => {
                    throw error;
                },
            });
        },
        onSuccess: async (_, __, { toastId }) => {
            await wait(1000);
            createBulkProducts();
            return toast.success("File processed successfully", {
                id: toastId,
            });
        },
        onError: (err, _, ctx) => {
            return handleClientError(err, ctx?.toastId);
        },
    });

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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        processFile(file);
        e.target.value = "";
    };

    return (
        <div className="relative">
            <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="relative"
                disabled={isProcessing || isCreating}
            >
                <Icons.Download />
                Import Products
            </DropdownMenuItem>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isProcessing || isCreating}
                accept=".csv"
                className="absolute inset-0 cursor-pointer opacity-0"
                style={{ display: "block", width: "100%", height: "100%" }}
            />
        </div>
    );
}