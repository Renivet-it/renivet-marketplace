import {
    ProductsAction,
    ProductsTable,
} from "@/components/dashboard/brands/products";
import { DashShell } from "@/components/globals/layouts";
import { ProductSearchSkuModal } from "@/components/globals/modals";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { productQueries } from "@/lib/db/queries";
import {
    brandCache,
    categoryCache,
    productTypeCache,
    subCategoryCache,
} from "@/lib/redis/methods";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Products",
    description: "Manage the brand's products",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
    }>;
    params: Promise<{ bId: string }>;
}

export default function Page(props: PageProps) {
    return (
        <DashShell>
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:gap-2">
                <div className="space-y-1 text-center md:text-start">
                    <h1 className="text-2xl font-bold">Products</h1>
                    <p className="text-balance text-sm text-muted-foreground">
                        Manage the brand&apos;s products
                    </p>
                </div>

                <div className="flex flex-col items-center gap-2 md:flex-row">
                    <Suspense
                        fallback={
                            <Button disabled className="h-8 text-xs">
                                <Icons.PlusCircle />
                                Add Product
                            </Button>
                        }
                    >
                        <NewProductButton {...props} />
                    </Suspense>

                    <Suspense
                        fallback={
                            <Button
                                disabled
                                variant="outline"
                                className="size-8 p-0"
                            >
                                <span className="sr-only">Search by SKU</span>
                                <Icons.Search />
                            </Button>
                        }
                    >
                        <ProductSearchSkuFetch {...props} />
                    </Suspense>

                    <Suspense
                        fallback={
                            <Button
                                disabled
                                variant="outline"
                                className="size-8 p-0"
                            >
                                <span className="sr-only">Open menu</span>
                                <Icons.MoreVertical />
                            </Button>
                        }
                    >
                        <ProductsActionFetch {...props} />
                    </Suspense>
                </div>
            </div>

            <Suspense fallback={<TableSkeleton />}>
                <ProductsFetch {...props} />
            </Suspense>
        </DashShell>
    );
}

async function ProductsFetch({ searchParams, params }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
    } = await searchParams;
    const { bId } = await params;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 10;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;

    const data = await productQueries.getProducts({
        brandIds: [bId],
        limit,
        page,
        search,
    });

    return <ProductsTable brandId={bId} initialData={data} />;
}

async function ProductsActionFetch({ params }: PageProps) {
    const { bId } = await params;

    const [brand, categories, subcategories, productTypes, products] =
        await Promise.all([
            brandCache.get(bId),
            categoryCache.getAll(),
            subCategoryCache.getAll(),
            productTypeCache.getAll(),
            productQueries.getAllProducts({ brandIds: [bId] }),
        ]);
    if (!brand) notFound();

    return (
        <ProductsAction
            brand={brand}
            categories={categories}
            subcategories={subcategories}
            productTypes={productTypes}
            products={products}
        />
    );
}

async function ProductSearchSkuFetch({ params }: PageProps) {
    const { bId } = await params;

    return <ProductSearchSkuModal brandId={bId} />;
}

async function NewProductButton({ params }: PageProps) {
    const { bId } = await params;

    return (
        <Button asChild className="h-8 text-xs">
            <Link href={`/dashboard/brands/${bId}/products/new`}>
                <Icons.PlusCircle />
                Add Product
            </Link>
        </Button>
    );
}
