import { CouponsPage, CouponsTable } from "@/components/dashboard/coupons";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { couponQueries } from "@/lib/db/queries";
import {
    categoryCache,
    productTypeCache,
    subCategoryCache,
} from "@/lib/redis/methods";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Coupons",
    description: "Manage coupons for the products",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        isActive?: string;
    }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Coupons</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage coupons for the products
                    </p>
                </div>

                <Suspense>
                    <CouponsPageFetch />
                </Suspense>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <CouponsFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function CouponsFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        isActive: isActiveRaw,
        search: searchRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const isActive =
        isActiveRaw === undefined || isActiveRaw === "true" ? true : false;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await couponQueries.getCoupons({
        page,
        limit,
        search,
        isActive,
    });

    return <CouponsTable initialData={data} />;
}

async function CouponsPageFetch() {
    const [categories, subcategories, productTypes] = await Promise.all([
        categoryCache.getAll(),
        subCategoryCache.getAll(),
        productTypeCache.getAll(),
    ]);

    return (
        <CouponsPage
            categories={categories}
            subcategories={subcategories}
            productTypes={productTypes}
        />
    );
}
