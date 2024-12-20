"use client";

import {
    ProductApproveForm,
    ProductRejectForm,
} from "@/components/globals/forms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CachedCategory,
    CachedProductType,
    CachedSubCategory,
    ProductWithBrand,
} from "@/lib/validations";

interface PageProps {
    product: ProductWithBrand;
    allCategories: CachedCategory[];
    allSubCategories: CachedSubCategory[];
    allProductTypes: CachedProductType[];
}

export function ProductActionPage({
    product,
    allCategories,
    allSubCategories,
    allProductTypes,
}: PageProps) {
    return (
        <Tabs defaultValue="approve">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="approve">Approve</TabsTrigger>
                <TabsTrigger value="reject">Reject</TabsTrigger>
            </TabsList>

            <TabsContent value="approve" className="pt-2">
                <ProductApproveForm
                    product={product}
                    allCategories={allCategories}
                    allSubCategories={allSubCategories}
                    allProductTypes={allProductTypes}
                />
            </TabsContent>

            <TabsContent value="reject" className="pt-2">
                <ProductRejectForm product={product} />
            </TabsContent>
        </Tabs>
    );
}
