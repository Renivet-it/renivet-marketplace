"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
} from "@/lib/validations";
import { unparse } from "papaparse";
import { toast } from "sonner";

interface PageProps {
    categories: CachedCategory[];
    subcategories: CachedSubCategory[];
    productTypes: CachedProductType[];
}

export function ProductTypesDownload({
    categories,
    subcategories,
    productTypes,
}: PageProps) {
    const handleDownload = () => {
        try {
            const csvData: Array<{
                Category: string;
                Subcategory: string;
                "Product Type": string;
            }> = [];

            // For each category
            categories.forEach((category) => {
                // Get subcategories for this category
                const relatedSubcategories = subcategories.filter(
                    (sub) => sub.categoryId === category.id
                );

                if (relatedSubcategories.length === 0) {
                    // If no subcategories, just add the category
                    csvData.push({
                        Category: category.name,
                        Subcategory: "",
                        "Product Type": "",
                    });
                } else {
                    // For each subcategory in this category
                    relatedSubcategories.forEach((subcategory) => {
                        // Get product types for this subcategory
                        const relatedProductTypes = productTypes.filter(
                            (pt) => pt.subCategoryId === subcategory.id
                        );

                        if (relatedProductTypes.length === 0) {
                            // If no product types, just add category and subcategory
                            csvData.push({
                                Category: category.name,
                                Subcategory: subcategory.name,
                                "Product Type": "",
                            });
                        } else {
                            // Add each product type with its category and subcategory
                            relatedProductTypes.forEach((productType) => {
                                csvData.push({
                                    Category: category.name,
                                    Subcategory: subcategory.name,
                                    "Product Type": productType.name,
                                });
                            });
                        }
                    });
                }
            });

            const csv = unparse(csvData, {
                quotes: true,
                header: true,
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = [
                "renivet",
                "product_types",
                "hierarchy",
                new Date().toISOString().split("T")[0],
                ".csv",
            ].join("_");
            link.click();
            URL.revokeObjectURL(link.href);

            toast.success("Product types exported successfully");
        } catch (error) {
            toast.error("Failed to export product types");
            console.error(error);
        }
    };

    return (
        <Button size="icon" variant="outline" onClick={handleDownload}>
            <Icons.Download />
            <span className="sr-only">Export Product Types</span>
        </Button>
    );
}
