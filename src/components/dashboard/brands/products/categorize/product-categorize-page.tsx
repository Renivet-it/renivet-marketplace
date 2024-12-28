"use client";

import { ProductCategorizeForm } from "@/components/globals/forms";
import { Badge } from "@/components/ui/badge";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { Separator } from "@/components/ui/separator";
import { cn, convertPaiseToRupees, formatPriceTag } from "@/lib/utils";
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
                    <h2 className="text-xl font-semibold">{product.name}</h2>

                    <Badge>{product.brand.name}</Badge>
                </div>

                <RichTextViewer content={product.description} />

                <Separator className="bg-foreground/20" />

                <p className="text-end text-xl font-semibold">
                    {formatPriceTag(
                        parseFloat(convertPaiseToRupees(product.price)),
                        true
                    )}
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
