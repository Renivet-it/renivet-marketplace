import {
    ProductTypesDownload,
    ProductTypesPage,
    ProductTypesTable,
} from "@/components/dashboard/general/product-types";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import {
    categoryCache,
    productTypeCache,
    subCategoryCache,
} from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Product Types",
    description: "Manage product types for the products",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Product Types</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage product types for the products
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ProductTypesPage />
                    <Suspense>
                        <ProductTypesDownloadFetch />
                    </Suspense>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <ProductTypesFetch />
            </Suspense>
        </DashShell>
    );
}

async function ProductTypesFetch() {
    const [categoryData, subCategoryData, data] = await Promise.all([
        categoryCache.getAll(),
        subCategoryCache.getAll(),
        productTypeCache.getAll(),
    ]);

    const parsed = {
        data,
        count: data.length,
    };

    return (
        <ProductTypesTable
            initialData={parsed}
            categories={categoryData}
            subCategories={subCategoryData}
        />
    );
}

async function ProductTypesDownloadFetch() {
    const [categories, subcategories, productTypes] = await Promise.all([
        categoryCache.getAll(),
        subCategoryCache.getAll(),
        productTypeCache.getAll(),
    ]);

    return (
        <ProductTypesDownload
            categories={categories}
            subcategories={subcategories}
            productTypes={productTypes}
        />
    );
}
