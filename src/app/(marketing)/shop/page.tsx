import { GeneralShell } from "@/components/globals/layouts";
import { ShopPage } from "@/components/shop";
import { brandQueries, productQueries } from "@/lib/db/queries";
import { Suspense } from "react";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        brandIds?: string;
    }>;
}

export default function Page({ searchParams }: PageProps) {
    return (
        <GeneralShell>
            <Suspense fallback={<>Loading...</>}>
                <ShopFetch searchParams={searchParams} />
            </Suspense>
        </GeneralShell>
    );
}

async function ShopFetch({ searchParams }: PageProps) {
    const {
        page: pageRaw,
        limit: limitRaw,
        search: searchRaw,
        brandIds: brandIdsRaw,
    } = await searchParams;

    const limit =
        limitRaw && !isNaN(parseInt(limitRaw)) ? parseInt(limitRaw) : 30;
    const page = pageRaw && !isNaN(parseInt(pageRaw)) ? parseInt(pageRaw) : 1;
    const search = searchRaw?.length ? searchRaw : undefined;
    const brandIds = brandIdsRaw?.length ? brandIdsRaw.split(",") : undefined;

    const [data, brandsMeta] = await Promise.all([
        productQueries.getProducts({
            page,
            limit,
            search,
            isAvailable: true,
            isPublished: true,
            brandIds,
        }),
        brandQueries.getBrandsMeta(),
    ]);

    return <ShopPage initialData={data} brandsMeta={brandsMeta} />;
}
