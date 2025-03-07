import {
    SubCategoriesPage,
    SubCategoriesTable,
} from "@/components/dashboard/general/sub-categories";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { categoryCache, subCategoryCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Sub Categories",
    description: "Manage sub-categories for the products",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Sub Categories</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage sub-categories for the products
                    </p>
                </div>

                <SubCategoriesPage />
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <SubCategoriesFetch />
            </Suspense>
        </DashShell>
    );
}

async function SubCategoriesFetch() {
    const categoryData = await categoryCache.getAll();
    const data = await subCategoryCache.getAll();

    const parsed = {
        data,
        count: data.length,
    };

    return (
        <SubCategoriesTable initialData={parsed} categories={categoryData} />
    );
}
