"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    CachedBrand,
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
    ProductWithBrand,
} from "@/lib/validations";
import { ProductExportButton } from "./product-export";
import { ProductImportButton } from "./product-import";
import { ProductTemplateButton } from "./product-template";

interface PageProps {
    brand: CachedBrand;
    categories: CachedCategory[];
    subcategories: CachedSubCategory[];
    productTypes: CachedProductType[];
    products: ProductWithBrand[];
}

export function ProductsAction({
    brand,
    categories,
    subcategories,
    productTypes,
    products,
}: PageProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="size-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <Icons.MoreVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                <ProductExportButton products={products} brand={brand} />

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <ProductTemplateButton />

                    <ProductImportButton
                        brand={brand}
                        categories={categories}
                        subcategories={subcategories}
                        productTypes={productTypes}
                    />
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
