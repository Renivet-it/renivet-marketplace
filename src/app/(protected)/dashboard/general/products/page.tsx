import { ProductsReviewTable } from "@/components/dashboard/general/products";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { productQueries } from "@/lib/db/queries";
import { Product } from "@/lib/validations";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Products",
    description: "Manage products under review",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        status?: Product["status"];
        search?: string;
    }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Products</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage products under review
                    </p>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <ProductsReviewFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function ProductsReviewFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        status: statusRaw,
        search: searchRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const status = statusRaw === undefined ? "pending" : statusRaw;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await productQueries.getProducts({
        limit,
        page,
        search,
        status,
    });

    return <ProductsReviewTable initialData={data} />;
}
