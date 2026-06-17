import { ProductsReviewTable } from "@/components/dashboard/general/products";
import {
    ProductExportAdminButton,
    ProductTemplateDownloadAdminButton,
} from "@/components/globals/buttons";
import { DashShell } from "@/components/globals/layouts";
import {
    ProductAddAdminModal,
    ProductSearchSkuModal,
} from "@/components/globals/modals";
import { TableSkeleton } from "@/components/globals/skeletons";
import { productQueries } from "@/lib/db/queries";
import {
    brandCache,
    categoryCache,
    productTypeCache,
    subCategoryCache,
} from "@/lib/redis/methods";
import { Product } from "@/lib/validations";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Products",
    description: "Manage products",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        verificationStatus?: Product["verificationStatus"] | "all";
        qcStatus?: Product["qcStatus"] | "all";
        catalogIssue?: "all" | "oos_but_live" | "stale_inventory" | "claim_mismatch";
        search?: string;
    }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell className="max-w-none px-0 md:px-2 lg:px-3">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Products</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage all products
                    </p>
                </div>

                <div className="flex w-full flex-wrap items-center justify-center gap-2 md:w-auto md:justify-end">
                    <Suspense>
                        <ProductAddAdminFetch />
                    </Suspense>
                    <ProductSearchSkuModal />
                    <Suspense>
                        <ProductExportAdminFetch />
                    </Suspense>
                    <ProductTemplateDownloadAdminButton />
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
        verificationStatus: verificationStatusRaw,
        qcStatus: qcStatusRaw,
        catalogIssue: catalogIssueRaw,
        search: searchRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 15;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const verificationStatus =
        verificationStatusRaw && verificationStatusRaw !== "all"
            ? verificationStatusRaw
            : undefined;
    const qcStatus =
        qcStatusRaw && qcStatusRaw !== "all" ? qcStatusRaw : undefined;
    const catalogIssue =
        catalogIssueRaw && catalogIssueRaw !== "all"
            ? catalogIssueRaw
            : undefined;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await productQueries.getProducts({
        limit,
        page,
        search,
        verificationStatus,
        qcStatus,
        catalogIssue,
    });

    return <ProductsReviewTable initialData={data} />;
}

async function ProductAddAdminFetch() {
    const [brands, categories, subcategories, productTypes] = await Promise.all(
        [
            brandCache.getAll(),
            categoryCache.getAll(),
            subCategoryCache.getAll(),
            productTypeCache.getAll(),
        ]
    );

    return (
        <ProductAddAdminModal
            brands={brands}
            categories={categories}
            subcategories={subcategories}
            productTypes={productTypes}
        />
    );
}

async function ProductExportAdminFetch() {
    const products = await productQueries.getAllProducts({});
    return <ProductExportAdminButton products={products} />;
}
