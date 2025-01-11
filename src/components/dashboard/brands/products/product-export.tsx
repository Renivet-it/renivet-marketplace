"use client";

import { Icons } from "@/components/icons";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CachedBrand, ProductWithBrand } from "@/lib/validations";
import { unparse } from "papaparse";
import { toast } from "sonner";

interface PageProps {
    brand: CachedBrand;
    products: ProductWithBrand[];
}

export function ProductExportButton({ products, brand }: PageProps) {
    const handleExport = () => {
        if (products.length === 0) return toast.error("No products to export");

        try {
            const productsData = products.flatMap((product) => {
                if (!product.productHasVariants) {
                    return [
                        {
                            "Product ID": product.id,
                            "Product Title": product.title,
                            "Product Description": product.description || "",
                            "Product Handle": product.slug,
                            "Meta Title": product.metaTitle || "",
                            "Meta Description": product.metaDescription || "",
                            "Meta Keywords": product.metaKeywords.join(", "),
                            "Product Status": product.isActive
                                ? "active"
                                : "draft",
                            Published: product.isPublished ? "true" : "false",
                            "Has Variants": "false",
                            Brand: product.brand.name,
                            Category: product.category.name,
                            Subcategory: product.subcategory.name,
                            "Product Type": product.productType.name,
                            "Verification Status": product.verificationStatus,
                            "Option1 Name": "",
                            "Option1 Value": "",
                            "Option2 Name": "",
                            "Option2 Value": "",
                            "Option3 Name": "",
                            "Option3 Value": "",
                            "Native SKU": product.nativeSku || "",
                            SKU: product.sku || "",
                            Barcode: product.barcode || "",
                            "Price (in Paise)": product.price || 0,
                            "Compare At Price (in Paise)":
                                product.compareAtPrice || "",
                            "Cost Per Item (in Paise)":
                                product.costPerItem || "",
                            Quantity: product.quantity || 0,
                            "Weight (g)": product.weight || 0,
                            "Length (cm)": product.length || 0,
                            "Width (cm)": product.width || 0,
                            "Height (cm)": product.height || 0,
                            "Country Code (ISO)": product.originCountry || "",
                            "HS Code": product.hsCode || "",
                        },
                    ];
                }

                return product.variants.map((variant, index) => {
                    const optionValues: Record<string, string> = {};
                    Object.entries(variant.combinations).forEach(
                        ([optionId, valueId], i) => {
                            if (i < 3) {
                                const option = product.options.find(
                                    (o) => o.id === optionId
                                );
                                const value = option?.values.find(
                                    (v) => v.id === valueId
                                );
                                optionValues[`Option${i + 1} Name`] =
                                    option?.name || "";
                                optionValues[`Option${i + 1} Value`] =
                                    value?.name || "";
                            }
                        }
                    );

                    return {
                        "Product ID": product.id,
                        "Product Title": product.title,
                        "Product Description":
                            index === 0 ? product.description || "" : "",
                        "Product Handle": index === 0 ? product.slug : "",
                        "Meta Title":
                            index === 0 ? product.metaTitle || "" : "",
                        "Meta Description":
                            index === 0 ? product.metaDescription || "" : "",
                        "Meta Keywords":
                            index === 0 ? product.metaKeywords.join(", ") : "",
                        "Product Status":
                            index === 0
                                ? product.isActive
                                    ? "active"
                                    : "draft"
                                : "",
                        Published:
                            index === 0
                                ? product.isPublished
                                    ? "true"
                                    : "false"
                                : "",
                        "Has Variants": index === 0 ? "true" : "",
                        Brand: index === 0 ? product.brand.name : "",
                        Category: index === 0 ? product.category.name : "",
                        Subcategory:
                            index === 0 ? product.subcategory.name : "",
                        "Product Type":
                            index === 0 ? product.productType.name : "",
                        "Verification Status":
                            index === 0 ? product.verificationStatus : "",
                        ...optionValues,
                        "Native SKU": variant.nativeSku,
                        SKU: variant.sku || "",
                        Barcode: variant.barcode || "",
                        "Price (in Paise)": variant.price,
                        "Compare At Price (in Paise)":
                            variant.compareAtPrice || "",
                        "Cost Per Item (in Paise)": variant.costPerItem || "",
                        Quantity: variant.quantity,
                        "Weight (g)": variant.weight,
                        "Length (cm)": variant.length,
                        "Width (cm)": variant.width,
                        "Height (cm)": variant.height,
                        "Country Code (ISO)": variant.originCountry || "",
                        "HS Code": variant.hsCode || "",
                    };
                });
            });

            const csv = unparse(productsData, {
                quotes: true,
                header: true,
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download =
                [
                    "renivet",
                    brand.name,
                    "products",
                    new Date().toISOString().split("T")[0],
                    Date.now(),
                ]
                    .join("_")
                    .toLowerCase() + ".csv";
            link.click();
            URL.revokeObjectURL(link.href);

            toast.success(`Successfully exported ${productsData.length} rows`);
        } catch (error) {
            toast.error("Failed to export products");
            console.error(error);
        }
    };

    return (
        <DropdownMenuItem
            onClick={handleExport}
            disabled={products.length === 0}
        >
            <Icons.Upload />
            Export as CSV
        </DropdownMenuItem>
    );
}
