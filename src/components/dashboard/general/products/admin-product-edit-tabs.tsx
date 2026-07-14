"use client";

import { ProductManageForm } from "@/components/globals/forms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductWithBrand } from "@/lib/validations";
import { useSearchParams } from "next/navigation";
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
    const searchParams = useSearchParams();
    const requestedTab = searchParams.get("tab");
    const requestedFocus = searchParams.get("focus");
    const defaultTab = requestedTab === "edit" || requestedFocus === "hsCode" ? "edit" : "qc";

    return (
        <Tabs defaultValue={defaultTab} className="space-y-4">
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
