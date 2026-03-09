import { productQueries } from "@/lib/db/queries";
import { brandCache, categoryCache } from "@/lib/redis/methods";
import { auth } from "@clerk/nextjs/server";
import { SummerClient } from "./summer-client";

export const metadata = {
    title: "RENIVET — Summer Edit",
    description: "Shop the Summer Collection",
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        search?: string;
        brandIds?: string;
        colors?: string;
        minPrice?: string;
        maxPrice?: string;
        categoryId?: string;
        subCategoryId?: string;
        productTypeId?: string;
        sortBy?: "price" | "createdAt" | "recommended" | "best-sellers";
        sortOrder?: "asc" | "desc";
        sizes?: string;
        minDiscount?: string;
    }>;
}

export default async function Page({ searchParams }: PageProps) {
    const params = await searchParams;
    const { userId } = await auth();

    const [brandsMeta, categories, initialData] = await Promise.all([
        brandCache.getAll(),
        categoryCache.getAll(),
        productQueries.getProducts({
            page: parseInt(params.page || "1"),
            limit: parseInt(params.limit || "24"),
            search: params.search,
            isAvailable: true,
            isActive: true,
            isPublished: true,
            isDeleted: false,
            verificationStatus: "approved",
            brandIds: params.brandIds?.split(","),
            minPrice: params.minPrice ? parseInt(params.minPrice) : 0,
            maxPrice: params.maxPrice ? parseInt(params.maxPrice) : 1000000,
            categoryId: params.categoryId,
            subcategoryId: params.subCategoryId,
            productTypeId: params.productTypeId,
            sortBy: params.sortBy === "recommended" ? undefined : params.sortBy,
            sortOrder:
                params.sortBy === "recommended" ? undefined : params.sortOrder,
            colors: params.colors?.split(","),
            sizes: params.sizes?.split(","),
            minDiscount: params.minDiscount
                ? parseInt(params.minDiscount)
                : undefined,
            prioritizeBestSellers:
                !params.search && parseInt(params.page || "1") === 1,
            requireMedia: true,
        }),
    ]);

    return (
        <SummerClient
            initialData={{
                data: initialData.data as any,
                count: initialData.count,
            }}
            brandsMeta={brandsMeta.map((b) => ({ id: b.id, name: b.name }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            userId={userId ?? undefined}
        />
    );
}
