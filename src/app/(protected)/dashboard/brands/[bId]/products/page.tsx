import { ProductsTable } from "@/components/dashboard/brands/products";
import { DashShell } from "@/components/globals/layouts";
import { TableSkeleton } from "@/components/globals/skeletons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { productQueries } from "@/lib/db/queries";
import { Metadata } from "next";
import Link from "next/link";
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

                <Suspense
                    fallback={
                        <Button
                            disabled
                            className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
                        >
                            <Icons.PlusCircle className="size-5" />
                            Create New Product
                        </Button>
                    }
                >
                    <NewProductButton {...props} />
                </Suspense>
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

async function NewProductButton({ params }: PageProps) {
    const { bId } = await params;

    return (
        <Button
            asChild
            className="h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm"
            disabled
        >
            <Link
                // href={`/dashboard/brands/${bId}/products/new`}
                href="#"
            >
                <Icons.PlusCircle className="size-5" />
                Create New Product
            </Link>
        </Button>
    );
}
