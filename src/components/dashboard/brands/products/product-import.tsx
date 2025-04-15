"use client";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog-dash";
import { Icons } from "@/components/icons";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
import { parseAsInteger, useQueryState } from "nuqs";
import { useRef, useState } from "react";
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

export function ProductImportButton({
    brand,
    categories,
    subcategories,
    productTypes,
}: PageProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search] = useQueryState("search", {
        defaultValue: "",
    });
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        mutationFn: async (products: CreateProduct[]) => {
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
    //                     if (!productGroups.has(title))
    //                         productGroups.set(title, []);

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
    //                         brandId: brand.id,
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
    //                         nativeSku: !hasVariants
    //                             ? generateSKU({
    //                                   brand,
    //                                   category: category.name,
    //                                   subcategory: subcategory.name,
    //                                   productType: productType.name,
    //                               })
    //                             : null,
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
    //                                     brand,
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
            // if (!row["Option1 Name"]?.trim()) {
            //     rowErrors["Option1 Name"] = "Option1 Name is required";
            // } else if (row["Option1 Name"].trim().length < 1) {
            //     rowErrors["Option1 Name"] = "Option1 Name must be at least 1 characters long";
            // }

            // if (!row["Option1 Value"]?.trim()) {
            //     rowErrors["Option1 Value"] = "Option1 Value is required";
            // } else if (row["Option1 Value"].trim().length < 1) {
            //     rowErrors["Option1 Value"] = "Option1 Value must be at least 1 characters long";
            // }


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

               const product: CreateProduct = {
                   brandId: brand.id,
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
                   sizeAndFit: "", // Add this
                   materialAndCare: "", // Add this
                //    nativeSku: !hasVariants
                //     ? generateSKU({
                //             brand,
                //             category: category.name,
                //             subcategory: subcategory.name,
                //             productType: productType.name,
                //         })
                //     : null,
                nativeSku: generateSKU({
                    brand: {
                        name: brand.name!,
                        id: brand.id!,
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
               };

               if (!hasVariants) {
                   // **Simple Product Handling (No Variants)**
                   product.sku = firstRow.SKU || "";
                   // product.barcode = firstRow.Barcode || null;
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
                   // product.hsCode = firstRow["HS Code"] || null;
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

                   // Generate product variants
                //    product.variants = rows.map((row) => {
                //     const combinations = product.options!.reduce((acc, option) => {
                //         const valueKey = Object.keys(row).find(
                //             (key) =>
                //                 key.match(/^Option\d+\s+Value$/) &&
                //                 String(row[key as keyof ImportRow] ?? "").trim() === option.values.find((v) => v.name)?.name
                //         );

                //         const valueForThisOption = valueKey
                //             ? String(row[valueKey as keyof ImportRow] ?? "").trim()
                //             : "";
                //                         const optionValue = option.values.find((v) => v.name === valueForThisOption);
                //         if (optionValue) {
                //             acc[option.id] = optionValue.id;
                //         }
                //         return acc;
                //     }, {} as Record<string, string>);

                //     const optionCombinations = product.options!.map((option) => {
                //         const valueKey = Object.keys(row).find(
                //             (key) =>
                //                 key.match(/^Option\d+\s+Value$/) &&
                //                 String(row[key as keyof ImportRow] ?? "").trim() === option.values.find((v) => v.name)?.name
                //         );
                //         const valueForThisOption = valueKey
                //             ? String(row[valueKey as keyof ImportRow] ?? "").trim()
                //             : "";

                //         return {
                //             name: String(option.name),
                //             value: valueForThisOption,
                //         };
                //     });
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


                       return {
                           id: crypto.randomUUID(),
                           productId: crypto.randomUUID(),
                           combinations,
                        nativeSku: generateSKU({
                            brand: {
                                name: brand.name!,
                             id: brand.id!,
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        processFile(file);
        e.target.value = "";
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
        <div className="relative">
            <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="relative"
                disabled={isCreating}
            >
                <Icons.Download />
                Import Products
            </DropdownMenuItem>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                disabled={isCreating}
                accept=".csv"
                className="absolute inset-0 cursor-pointer opacity-0"
                style={{ display: "block", width: "100%", height: "100%" }}
            />

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
        </div>
    );
}
