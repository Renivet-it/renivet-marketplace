import { productQueries } from "@/lib/db/queries";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const data = await productQueries.getProducts({
        page: parseInt(searchParams.get("page") || "1"),
        limit: parseInt(searchParams.get("limit") || "32"),
        search: searchParams.get("search") || undefined,
        brandIds: searchParams.get("brandIds")?.split(","),
        minPrice: parseInt(searchParams.get("minPrice") || "0"),
        maxPrice: parseInt(searchParams.get("maxPrice") || "10000"),
        categoryId: searchParams.get("categoryId") || undefined,
        subcategoryId: searchParams.get("subCategoryId") || undefined,
        productTypeId: searchParams.get("productTypeId") || undefined,
        sortBy: (searchParams.get("sortBy") || undefined) as
            | "price"
            | "createdAt"
            | undefined,
        sortOrder: (searchParams.get("sortOrder") || undefined) as
            | "asc"
            | "desc"
            | undefined,
        colors: searchParams.get("colors")?.split(","),
        sizes: searchParams.get("sizes")?.split(","),
        isAvailable: true,
        isActive: true,
        isPublished: true,
        isDeleted: false,
        verificationStatus: "approved",
        requireMedia: true,
    });

    return NextResponse.json(data);
}
