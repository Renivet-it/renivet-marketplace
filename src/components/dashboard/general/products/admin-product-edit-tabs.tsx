"use client";

import { ProductManageForm } from "@/components/globals/forms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductWithBrand } from "@/lib/validations";
import type { ComponentProps } from "react";
import { ProductQcPanel } from "./product-qc-panel";

type ProductManageFormProps = ComponentProps<typeof ProductManageForm>;

interface AdminProductEditTabsProps extends ProductManageFormProps {
    product: ProductWithBrand;
}

export function AdminProductEditTabs({
    product,
    ...productManageFormProps
}: AdminProductEditTabsProps) {
    return (
        <Tabs defaultValue="qc" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 md:w-fit">
                <TabsTrigger value="qc">QC Recommendation</TabsTrigger>
                <TabsTrigger value="edit">Edit Product</TabsTrigger>
            </TabsList>

            <TabsContent value="qc" className="mt-0">
                <ProductQcPanel product={product} />
            </TabsContent>

            <TabsContent value="edit" className="mt-0">
                <ProductManageForm
                    {...productManageFormProps}
                    product={product}
                />
            </TabsContent>
        </Tabs>
    );
}
