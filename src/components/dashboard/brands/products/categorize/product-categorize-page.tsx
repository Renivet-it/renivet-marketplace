"use client";

import { ProductCategorizeForm } from "@/components/globals/forms";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { Separator } from "@/components/ui/separator";
import { cn, formatPriceTag } from "@/lib/utils";
import {
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
    ProductWithBrand,
} from "@/lib/validations";

interface PageProps extends GenericProps {
    product: ProductWithBrand;
    categories: CachedCategory[];
    subCategories: CachedSubCategory[];
    productTypes: CachedProductType[];
}

export function ProductCategorizePage({
    className,
    product,
    categories,
    subCategories,
    productTypes,
    ...props
}: PageProps) {
    return (
        <div className={cn("space-y-5", className)} {...props}>
            <div className="space-y-3 rounded-md bg-muted p-5">
                <div className="flex items-start justify-between gap-2">
                    <div className="text-lg font-semibold">{product.name}</div>
                    <p className="bg-accent p-1 px-2 text-xs text-accent-foreground">
                        {product.brand.name}
                    </p>
                </div>

                <RichTextViewer content={product.description} />

                <Separator className="bg-foreground/20" />

                <p className="text-end text-xl font-semibold">
                    {formatPriceTag(parseFloat(product.price), true)}
                </p>
            </div>

            <Separator />

            <ProductCategorizeForm
                product={product}
                allCategories={categories}
                allSubCategories={subCategories}
                allProductTypes={productTypes}
            />
        </div>
    );
}
