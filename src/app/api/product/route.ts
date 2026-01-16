import { productQueries } from "@/lib/db/queries";
import {
    brandCache,
    categoryCache,
    productTypeCache,
    subCategoryCache,
} from "@/lib/redis/methods";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const [allCategories, allSubCategories, allProductTypes, allBrands] =
        await Promise.all([
            categoryCache.getAll(),
            subCategoryCache.getAll(),
            productTypeCache.getAll(),
            brandCache.getAll(),
        ]);

    const activeCategory = allCategories.find(
        (c) => c.slug === searchParams.get("categoryId")
    );
    const activeSubCategory = allSubCategories.find(
        (s) => s.slug === searchParams.get("subCategoryId")
    );
    const activeProductType = allProductTypes.find(
        (t) => t.slug === searchParams.get("productTypeId")
    );

    const categoryId = activeCategory?.id;
    const subcategoryId = activeSubCategory?.id;
    const productTypeId = activeProductType?.id;

    const brandIds = searchParams
        .get("brandIds")
        ?.split(",")
        .map((slug) => allBrands.find((b) => b.slug === slug)?.id)
        .filter(Boolean) as string[];

    const data = await productQueries.getProducts({
        page: parseInt(searchParams.get("page") || "1"),
        limit: parseInt(searchParams.get("limit") || "32"),
        search: searchParams.get("search") || undefined,
        brandIds: brandIds.length > 0 ? brandIds : undefined,
        minPrice: parseInt(searchParams.get("minPrice") || "0"),
        maxPrice: parseInt(searchParams.get("maxPrice") || "10000"),
        categoryId,
        subcategoryId,
        productTypeId,
        sortBy:
            (searchParams.get("sortBy") as "price" | "createdAt") || undefined,
        sortOrder:
            (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
        colors: searchParams.get("colors")?.split(","),
        sizes: searchParams.get("sizes")?.split(","),
        isAvailable: true,
        isActive: true,
        isPublished: true,
        isDeleted: false,
        verificationStatus: "approved",
    });

    return NextResponse.json(data);
}
