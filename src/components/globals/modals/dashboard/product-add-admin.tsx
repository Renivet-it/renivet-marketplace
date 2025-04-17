"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription
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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
    "Size and Fit": string,
    "Material and Care": string,
    "Return (TRUE/FALSE)": string,
    "Return Policy Description(IF yes)": string,
    "Replace (TRUE/FALSE)": string,
    "Replace Policy Description(IF yes)": string,
    [key: `Specification${number} Label` | `Specification${number} Value`]: string | undefined;
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
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
            setIsAddModalOpen(false);
            setIsModalOpen(true);
           // Extract error message properly
           const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
           setErrorMessages([errorMessage]); // Set message in modal
            return handleClientError(err, ctx?.toastId);
        },
    });


    // const processFile = (file: File) => {
    //     parse<ImportRow>(file, {
    //         header: true,
    //         skipEmptyLines: true,
    //         complete: async (results) => {
    //             const toastId = toast.loading("Processing file...");

    //             try {
    //                 const productGroups = new Map<string, ImportRow[]>();

    //                 results.data = results.data.filter((row) => {
    //                     return row["Product Title"]?.trim();
    //                 });

    //                 results.data.forEach((row) => {
    //                     const title = row["Product Title"];
    //                     if (!productGroups.has(title)) {
    //                         productGroups.set(title, []);
    //                     }
    //                     productGroups.get(title)?.push(row);
    //                 });

    //                 const products: CreateProduct[] = [];

    //                 for (const [title, rows] of productGroups) {
    //                     const firstRow = rows[0];
    //                     const hasVariants =
    //                         firstRow["Has Variants"].toLowerCase() === "true";

    //                     const category = findCategory(
    //                         firstRow.Category,
    //                         categories
    //                     );
    //                     const subcategory = findSubcategory(
    //                         firstRow.Subcategory,
    //                         firstRow.Category,
    //                         categories,
    //                         subcategories
    //                     );
    //                     const productType = findProductType(
    //                         firstRow["Product Type"],
    //                         firstRow.Subcategory,
    //                         firstRow.Category,
    //                         categories,
    //                         subcategories,
    //                         productTypes
    //                     );

    //                     const product: CreateProduct = {
    //                         brandId: brandId!,
    //                         title,
    //                         description:
    //                             firstRow["Product Description (HTML)"] || "",
    //                         metaTitle: firstRow["Meta Title"] || "",
    //                         metaDescription: firstRow["Meta Description"] || "",
    //                         metaKeywords:
    //                             firstRow["Meta Keywords"]
    //                                 ?.split(",")
    //                                 .map((k) => k.trim())
    //                                 .filter(Boolean) || [],
    //                         categoryId: category.id,
    //                         subcategoryId: subcategory.id,
    //                         productTypeId: productType.id,
    //                         productHasVariants: hasVariants,
    //                         barcode: null,
    //                         price: 0,
    //                         compareAtPrice: null,
    //                         costPerItem: null,
    //                         height: 0,
    //                         hsCode: null,
    //                         length: 0,
    //                         media: [],
    //                         nativeSku: generateSKU({
    //                             brand: {
    //                                 name: brandName!,
    //                                 id: brandId!,
    //                             },
    //                             category: category.name,
    //                             subcategory: subcategory.name,
    //                             productType: productType.name,
    //                         }),
    //                         options: [],
    //                         originCountry: null,
    //                         quantity: 0,
    //                         sku: null,
    //                         sustainabilityCertificate: null,
    //                         variants: [],
    //                         weight: 0,
    //                         width: 0,
    //                     };

    //                     if (!hasVariants) {
    //                         product.sku = firstRow.SKU || "";
    //                         product.barcode = firstRow.Barcode || null;
    //                         product.price = convertPriceToPaise(
    //                             parseFloat(firstRow["Price (in Rupees)"]) || 0
    //                         );
    //                         product.compareAtPrice =
    //                             convertPriceToPaise(
    //                                 parseFloat(
    //                                     firstRow["Compare At Price (in Rupees)"]
    //                                 ) || 0
    //                             ) || null;
    //                         product.costPerItem =
    //                             convertPriceToPaise(
    //                                 parseFloat(
    //                                     firstRow["Cost Per Item (in Rupees)"]
    //                                 ) || 0
    //                             ) || null;
    //                         product.quantity = parseInt(firstRow.Quantity) || 0;
    //                         product.weight =
    //                             parseInt(firstRow["Weight (g)"]) || 0;
    //                         product.length =
    //                             parseInt(firstRow["Length (cm)"]) || 0;
    //                         product.width =
    //                             parseInt(firstRow["Width (cm)"]) || 0;
    //                         product.height =
    //                             parseInt(firstRow["Height (cm)"]) || 0;
    //                         product.originCountry =
    //                             firstRow["Country Code (ISO)"] || null;
    //                         product.hsCode = firstRow["HS Code"] || null;
    //                     } else {
    //                         const optionsMap = new Map<string, Set<string>>();

    //                         for (const row of rows) {
    //                             for (let i = 1; i <= 3; i++) {
    //                                 const name =
    //                                     row[
    //                                         `Option${i} Name` as keyof ImportRow
    //                                     ];
    //                                 const value =
    //                                     row[
    //                                         `Option${i} Value` as keyof ImportRow
    //                                     ];
    //                                 if (name && value) {
    //                                     if (!optionsMap.has(name)) {
    //                                         optionsMap.set(name, new Set());
    //                                     }
    //                                     optionsMap.get(name)?.add(value);
    //                                 }
    //                             }
    //                         }

    //                         product.options = Array.from(
    //                             optionsMap.entries()
    //                         ).map(([name, values], index) => ({
    //                             id: crypto.randomUUID(),
    //                             productId: crypto.randomUUID(),
    //                             name,
    //                             position: index,
    //                             values: Array.from(values).map(
    //                                 (value, vIndex) => ({
    //                                     id: crypto.randomUUID(),
    //                                     name: value,
    //                                     position: vIndex,
    //                                 })
    //                             ),
    //                             isDeleted: false,
    //                             deletedAt: null,
    //                             createdAt: new Date(),
    //                             updatedAt: new Date(),
    //                         }));

    //                         product.variants = rows.map((row) => {
    //                             const combinations = product.options!.reduce(
    //                                 (acc, option) => {
    //                                     const valueForThisOption =
    //                                         row[
    //                                             `Option${option.position + 1} Value` as keyof ImportRow
    //                                         ];
    //                                     const optionValue = option.values.find(
    //                                         (v) => v.name === valueForThisOption
    //                                     );

    //                                     if (optionValue) {
    //                                         acc[option.id] = optionValue.id;
    //                                     }
    //                                     return acc;
    //                                 },
    //                                 {} as Record<string, string>
    //                             );

    //                             const optionCombinations = product.options!.map(
    //                                 (option) => {
    //                                     const valueForThisOption =
    //                                         row[
    //                                             `Option${option.position + 1} Value` as keyof ImportRow
    //                                         ];
    //                                     return {
    //                                         name: option.name,
    //                                         value: valueForThisOption || "",
    //                                     };
    //                                 }
    //                             );

    //                             return {
    //                                 id: crypto.randomUUID(),
    //                                 productId: crypto.randomUUID(),
    //                                 combinations,
    //                                 nativeSku: generateSKU({
    //                                     brand: {
    //                                         name: brandName!,
    //                                         id: brandId!,
    //                                     },
    //                                     category: category.name,
    //                                     subcategory: subcategory.name,
    //                                     productType: productType.name,
    //                                     options: optionCombinations,
    //                                 }),
    //                                 sku: row.SKU,
    //                                 barcode: row.Barcode || null,
    //                                 price:
    //                                     convertPriceToPaise(
    //                                         parseFloat(
    //                                             row["Price (in Rupees)"]
    //                                         ) || 0
    //                                     ) || 0,
    //                                 compareAtPrice:
    //                                     convertPriceToPaise(
    //                                         parseFloat(
    //                                             row[
    //                                                 "Compare At Price (in Rupees)"
    //                                             ]
    //                                         ) || 0
    //                                     ) || null,
    //                                 costPerItem:
    //                                     convertPriceToPaise(
    //                                         parseFloat(
    //                                             row["Cost Per Item (in Rupees)"]
    //                                         ) || 0
    //                                     ) || null,
    //                                 quantity: parseInt(row.Quantity) || 0,
    //                                 weight: parseInt(row["Weight (g)"]) || 0,
    //                                 length: parseInt(row["Length (cm)"]) || 0,
    //                                 width: parseInt(row["Width (cm)"]) || 0,
    //                                 height: parseInt(row["Height (cm)"]) || 0,
    //                                 originCountry:
    //                                     row["Country Code (ISO)"] || null,
    //                                 hsCode: row["HS Code"] || null,
    //                                 image: null,
    //                                 isDeleted: false,
    //                                 deletedAt: null,
    //                                 createdAt: new Date(),
    //                                 updatedAt: new Date(),
    //                             };
    //                         });
    //                     }

    //                     products.push(product);
    //                 }

    //                 toast.success("File processed successfully", {
    //                     id: toastId,
    //                 });
    //                 await wait(1000);
    //                 createBulkProducts(products);
    //             } catch (error) {
    //                 console.error(error);
    //                 return toast.error("Invalid content in file", {
    //                     id: toastId,
    //                 });
    //             }
    //         },
    //     });
    // };

    const [errorRows, setErrorRows] = useState<{ row: number; errors: Record<string, string> }[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
const processFile = async (file: File) => {
    setErrorRows([]); // Reset errors
    const toastId = toast.loading("Processing file...");

    try {
        // Read the file as binary string
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet name and read sheet data
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON
        const rows: ImportRow[] = XLSX.utils.sheet_to_json(sheet);
        const skuOccurrences: Record<string, number[]> = {};
        // Filter out empty rows
        const filteredRows = rows.filter((row) => row["Product Title"]?.trim());

        const errors: { row: number; errors: Record<string, string> }[] = [];
        rows.forEach((row, index) => {
            const rowErrors: Record<string, string> = {};
            const rowNumber = index + 2; // Excel row numbers start from 2

            // Validation Rules
            if (!row["Product Title"]?.trim()) {
                rowErrors["Product Title"] = "Product Title is required";
              } else if (row["Product Title"].trim().length < 3) {
                rowErrors["Product Title"] = "Product Title must be at least 3 characters long";
              }


              if (row["Product Description (HTML)"]) {
                const trimmedMetaTitle = row["Product Description (HTML)"].trim();
                if (trimmedMetaTitle.length < 3) {
                  rowErrors["Product Description (HTML)"] = "Product Description (HTML) must be at least 3 characters long";
                }
              }
              if (row["Meta Title"]) {
                const trimmedMetaTitle = row["Meta Title"].trim();
                if (trimmedMetaTitle.length < 3) {
                  rowErrors["Meta Title"] = "Meta Title must be at least 3 characters long";
                } else if (trimmedMetaTitle.length > 70) {
                  rowErrors["Meta Title"] = "Meta Title must be at most 70 characters long";
                }
              }

              if (row["Meta Description"]) {
                const trimmedMetaDescription = row["Meta Description"].trim();
                if (trimmedMetaDescription.length < 3) {
                  rowErrors["Meta Description"] = "Meta Description must be at least 3 characters long";
                } else if (trimmedMetaDescription.length > 160) {
                  rowErrors["Meta Description"] = "Meta Description must be at most 160 characters long";
                }
              }
              if (!row["Meta Keywords"]?.trim()) {
                rowErrors["Meta Keywords"] = "Meta Keywords is required";
            } else if (row["Meta Keywords"].trim().length < 3) {
                rowErrors["Meta Keywords"] = "Meta Keywords must be at least 1 characters long";
              }
              const sku = row["SKU"]?.trim();
              if (!sku) {
                  rowErrors["SKU"] = "SKU is required";
              } else {
                  (skuOccurrences[sku] ||= []).push(rowNumber); // Store row numbers for each SKU
              }
            if (!row["Category"]?.trim()) {
                rowErrors["Category"] = "Category is required";
            }
            if (!row["Subcategory"]?.trim()) {
                rowErrors["Subcategory"] = "Sub Category is required";
            }

            // Validate weight and dimensions
            if (row["Weight (g)"] !== "" && Number(row["Weight (g)"]) < 0) {
                rowErrors["Weight (g)"] = "Weight must be a non-negative number";
            }

            if (row["Length (cm)"] !== "" && Number(row["Length (cm)"]) < 0) {
                rowErrors["Length (cm)"] = "Length must be a non-negative number";
            }

            if (row["Width (cm)"] !== "" && Number(row["Width (cm)"]) < 0) {
                rowErrors["Width (cm)"] = "Width must be a non-negative number";
            }

            if (row["Height (cm)"] !== "" && Number(row["Height (cm)"]) < 0) {
                rowErrors["Height (cm)"] = "Height must be a non-negative number";
            }


            if (row["Price (in Rupees)"] === "" || Number(row["Price (in Rupees)"]) <= 0) {
              rowErrors["Price"] = "Price must be a valid number greater than 0";
            }
            if (!row["Product Type"]?.trim()) {
                rowErrors["Product Type"] = "Product Type is required";
            }

            if (row["Quantity"] === "" || Number(row["Quantity"]) < 0) {
              rowErrors["Quantity"] = "Quantity must be a non-negative integer";
            }

            try {
                findProductType(
                    row["Product Type"],
                    row["Subcategory"],
                    row["Category"],
                    categories,
                    subcategories,
                    productTypes
                );
            } catch (error: any) {
                rowErrors["Product Type"] = error.message;
            }

            try {
                findCategory(row["Category"], categories);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    rowErrors["Category"] = error.message;
                } else {
                    rowErrors["Category"] = "An unknown error occurred while validating the Category.";
                }
            }

            try {
                findSubcategory(row["Subcategory"], row["Category"], categories, subcategories);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    rowErrors["Subcategory"] = error.message;
                } else {
                    rowErrors["Subcategory"] = "An unknown error occurred while validating the Subcategory.";
                }
            }

            // If any errors exist, store them
            if (Object.keys(rowErrors).length > 0) {
              errors.push({ row: rowNumber, errors: rowErrors });
            }
          });
            // Check for duplicates in one go
            Object.entries(skuOccurrences).forEach(([sku, occurrences]) => {
                if (occurrences.length > 1) {
                    occurrences.forEach((rowNum) => {
                        errors.push({ row: rowNum, errors: { "SKU": `Duplicate SKU '${sku}' in rows: ${occurrences.join(", ")}` } });
                    });
                }
            });
          if (errors.length > 0) {
            setErrorRows(errors);
            setIsDialogOpen(true);
            toast.error("Some rows have errors. Please fix them.", { id: toastId });
            return;
          }


        // Group products by title
        const productGroups = new Map<string, ImportRow[]>();
        filteredRows.forEach((row) => {
            const title = row["Product Title"];
            if (!productGroups.has(title)) {
                productGroups.set(title, []);
            }
            productGroups.get(title)?.push(row);
        });

        const products: CreateProduct[] = [];

        for (const [title, rows] of productGroups) {
            const firstRow = rows[0];
            const hasVariants = String(firstRow["Has Variants"] || "").trim().toLowerCase() === "true";


            const category = findCategory(firstRow.Category, categories);
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
            // const specifications = [];
            // if (firstRow["Specification1 Label"]?.trim() && firstRow["Specification1 Value"]?.trim()) {
            //     specifications.push({
            //         key: firstRow["Specification1 Label"].trim(),
            //         value: firstRow["Specification1 Value"].trim(),
            //     });
            // }
            // // Add more specification pairs if present (e.g., Specification2 Label, etc.)
            // for (let i = 2; i <= 10; i++) { // Assuming up to 10 pairs max
            //     const label = firstRow[`Specification${i} Label` as keyof ImportRow]?.trim();
            //     const value = firstRow[`Specification${i} Value` as keyof ImportRow]?.trim();
            //     if (label && value) {
            //         specifications.push({ key: label, value });
            //     }
            // }
            const specifications = [];
            const specKeys = Object.keys(firstRow).filter((key) =>
                /^Specification\d+ Label$/.test(key)
            );
            for (const labelKey of specKeys) {
                const valueKey = labelKey.replace("Label", "Value");
                // const label = firstRow[labelKey]?.trim();
                // const value = firstRow[valueKey]?.trim();
                const label = (firstRow[labelKey as keyof ImportRow] as string)?.trim();
                const value = (firstRow[valueKey as keyof ImportRow] as string)?.trim();

                if (label && value) {
                    specifications.push({ key: label, value });
                }
            }
            const product: CreateProduct = {
                brandId: brandId!,
                title,
                description: firstRow["Product Description (HTML)"] || "",
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
                sku: firstRow["SKU"] ? String(firstRow["SKU"]).trim() : null,
                sustainabilityCertificate: null,
                variants: [],
                weight: 0,
                width: 0,
                sizeAndFit: firstRow["Size and Fit"]?.trim() || "",
                materialAndCare: firstRow["Material and Care"]?.trim() || "",
                returnable: String(firstRow["Return (TRUE/FALSE)"] || "").trim().toLowerCase() === "true",
                exchangeable: String(firstRow["Replace (TRUE/FALSE)"] || "").trim().toLowerCase() === "true",
                returnDescription: firstRow["Return Policy Description(IF yes)"]?.trim() || "",
                exchangeDescription: firstRow["Replace Policy Description(IF yes)"]?.trim() || "",
                specifications,
            };

            if (!hasVariants) {
                // **Simple Product Handling (No Variants)**
                product.sku = firstRow.SKU || "";
                product.barcode = String(firstRow.Barcode || "").trim();
                product.hsCode = String(firstRow["HS Code"] || "").trim();
                product.price = convertPriceToPaise(
                    parseFloat(firstRow["Price (in Rupees)"]) || 0
                );
                product.compareAtPrice =
                    convertPriceToPaise(
                        parseFloat(firstRow["Compare At Price (in Rupees)"]) || 0
                    ) || null;
                product.costPerItem =
                    convertPriceToPaise(
                        parseFloat(firstRow["Cost Per Item (in Rupees)"]) || 0
                    ) || null;
                product.quantity = parseInt(firstRow.Quantity) || 0;
                product.weight = parseInt(firstRow["Weight (g)"]) || 0;
                product.length = parseInt(firstRow["Length (cm)"]) || 0;
                product.width = parseInt(firstRow["Width (cm)"]) || 0;
                product.height = parseInt(firstRow["Height (cm)"]) || 0;
                product.originCountry = firstRow["Country Code (ISO)"] || null;
            } else {
                // **Variant Product Handling**
                const optionsMap = new Map<string, Set<string>>();

                for (const row of rows) {
                    for (let i = 1; i <= 3; i++) {
                        const name = row[`Option${i} Name` as keyof ImportRow];
                        const value = row[`Option${i} Value` as keyof ImportRow];

                        if (name && value) {
                            if (!optionsMap.has(name)) {
                                optionsMap.set(name, new Set());
                            }
                            optionsMap.get(name)?.add(value);
                        }
                    }
                }

                // Generate product options
                product.options = Array.from(optionsMap.entries()).map(
                    ([name, values], index) => ({
                        id: crypto.randomUUID(),
                        productId: crypto.randomUUID(),
                        name,
                        position: index,
                        values: Array.from(values).map((value, vIndex) => ({
                            id: crypto.randomUUID(),
                            name: String(value), // Force string
                            position: vIndex,
                        })),
                        isDeleted: false,
                        deletedAt: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    })
                );


                product.variants = rows.map((row, rowIndex) => {
                    const combinations: Record<string, string> = {};
                    const rowErrors: Record<string, string> = {};
                    const rowNumber = rowIndex + 2;

                    product.options!.forEach((option, index) => {
                        const optionValueKey = `Option${index + 1} Value`;
                        const valueForThisOption = String(row[optionValueKey as keyof ImportRow] ?? "").trim();

                        if (!valueForThisOption) {
                            rowErrors[optionValueKey] = `Value for option "${option.name}" is required`;
                            return;
                        }

                const optionValue = option.values.find((v) => v.name === valueForThisOption);
                        if (!optionValue) {
                            rowErrors[optionValueKey] = `Invalid value "${valueForThisOption}" for option "${option.name}"`;
                            return;
                        }
                                        combinations[option.id] = optionValue.id;
                    });

                    if (Object.keys(rowErrors).length > 0) {
                        errors.push({ row: rowNumber, errors: rowErrors });
                    }
                    const optionCombinations = product.options!.map((option) => ({
                        name: option.name,
                        value: option.values.find((v) => v.id === combinations[option.id])?.name || "",
                    }));
                    // Build specifications array for the variant
                    const variantSpecifications = [];
                    const variantSpecKeys = Object.keys(row).filter((key) =>
                        /^Specification\d+ Label$/.test(key)
                    );
                    for (const labelKey of variantSpecKeys) {
                        const valueKey = labelKey.replace("Label", "Value");
                        const label = (row as any)[labelKey]?.trim();
                        const value = (row as any)[valueKey]?.trim();
                        if (label && value) {
                            variantSpecifications.push({ key: label, value });
                        }
                    }

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
                        price:
                            convertPriceToPaise(
                                parseFloat(row["Price (in Rupees)"]) || 0
                            ) || 0,
                        compareAtPrice:
                            convertPriceToPaise(
                                parseFloat(
                                    row["Compare At Price (in Rupees)"]
                                ) || 0
                            ) || null,
                        costPerItem:
                            convertPriceToPaise(
                                parseFloat(row["Cost Per Item (in Rupees)"]) || 0
                            ) || null,
                        quantity: parseInt(row.Quantity) || 0,
                        weight: parseInt(row["Weight (g)"]) || 0,
                        length: parseInt(row["Length (cm)"]) || 0,
                        width: parseInt(row["Width (cm)"]) || 0,
                        height: parseInt(row["Height (cm)"]) || 0,
                        originCountry: row["Country Code (ISO)"] || null,
                        barcode: String(row.Barcode || "").trim(),
                        hsCode: String(row["HS Code"] || "").trim(),
                        sizeAndFit:String(row["Size and Fit"])?.trim() || "",
                        materialAndCare:String(row["Material and Care"])?.trim() || "",
                        returnable: String(row["Return (TRUE/FALSE)"] || "").trim().toLowerCase() === "true",
                        exchangeable: String(row["Replace (TRUE/FALSE)"] || "").trim().toLowerCase() === "true",
                        returnDescription: String(row["Return Policy Description(IF yes)"] || "").trim() || "",
                        exchangeDescription: String(row["Replace Policy Description(IF yes)"] || "").trim() || "",
                        image: null,
                        specifications: variantSpecifications,
                        isDeleted: false,
                        deletedAt: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                });
            }

            products.push(product);
        }

        toast.success("File processed successfully", { id: toastId });
        await wait(1000);
        createBulkProducts(products);
    } catch (error) {
        console.error(error);
        toast.error("Invalid content in file", { id: toastId });
    }
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

    const exportErrorsToExcel = () => {
        if (!errorRows.length) return;
        const worksheet = XLSX.utils.json_to_sheet(errorRows.map(({ row, errors }) => ({
            "Row No": row,
            "Error Message": typeof errors === "object" ? Object.values(errors).join(", ") : errors,
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Errors");

        // Create the file and trigger download
        XLSX.writeFile(workbook, "file_errors.xlsx");
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
           {/* Error Dialog */}
           <Dialog open={isModalOpen} onOpenChange={(open) => setIsModalOpen(open)}>
               <DialogContent>
                   <DialogHeader>
                       <DialogTitle>Errors Found</DialogTitle>
                   </DialogHeader>
                   <div className="space-y-2">
                       {errorMessages.map((msg, index) => (
                           <div key={index} className="text-red-500">
                               {msg}
                           </div>
                       ))}
                   </div>
                   <DialogFooter>
                       <Button onClick={() => setIsModalOpen(false)}>Close</Button>
                   </DialogFooter>
               </DialogContent>
           </Dialog>

             {/* Error Dialog */}


             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent className="max-w-4xl p-6">
    <DialogHeader>
      <DialogTitle>File Errors</DialogTitle>
      <DialogDescription>
        Some rows have issues. Please review and fix them.
      </DialogDescription>
    </DialogHeader>

    {/* Scrollable Table Container */}
    <div className="max-h-96 overflow-auto  rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="p-4  text-left">Row No</TableHead>
            <TableHead className="p-4 text-left">Error Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errorRows.length > 0 ? (
            errorRows.map((error, index) => (
              <TableRow key={index} className="border-b border-gray-200">
                <TableCell className="p-4 font-medium">{error.row}</TableCell>
                <TableCell className="p-4">
                  {typeof error.errors === "object" ? (
                    <ul className="list-disc pl-4">
                      {Object.entries(error.errors).map(([key, message], i) => (
                        <li key={i} className="text-sm text-red-600">
                          <strong>{key}:</strong> {message}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    error.errors
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="p-4 text-center text-gray-500">
                No errors found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>

    {/* Footer with Close Button */}
    <div className="flex items-center justify-end gap-2 p-4 ">
    <Button onClick={exportErrorsToExcel} variant="outline">Export Errors as Excel</Button>
  <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
</div>
  </DialogContent>
</Dialog>

       </>
    );
}
