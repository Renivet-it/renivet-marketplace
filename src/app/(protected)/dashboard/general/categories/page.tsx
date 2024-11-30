import {
    CategoriesPage,
    CategoriesTable,
} from "@/components/dashboard/general/categories";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { categoryCache } from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Categories",
    description: "Manage categories for the products",
};

export default function Page() {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <div className="text-2xl font-semibold">Categories</div>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage categories for the products
                    </p>
                </div>

                <CategoriesPage />
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <CategoriesFetch />
            </Suspense>
        </DashShell>
    );
}

async function CategoriesFetch() {
    const data = await categoryCache.getAll();

    const parsed = {
        data,
        count: data.length,
    };

    return <CategoriesTable initialData={parsed} />;
}
