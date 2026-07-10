import { StorefrontCatalogPage } from "@/components/shop";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        shopPage?: string;
        limit?: string;
        search?: string;
        brandIds?: string;
        colors?: string;
        minPrice?: string;
        maxPrice?: string;
        categoryId?: string;
        subCategoryId?: string;
        subcategoryId?: string;
        productTypeId?: string;
        sortBy?: "price" | "createdAt" | "recommended" | "best-sellers";
        sortOrder?: "asc" | "desc";
        sizes?: string;
        minDiscount?: string;
    }>;
}

export default async function Page({ searchParams }: PageProps) {
    return (
        <StorefrontCatalogPage
            searchParams={searchParams}
            basePath="/shop"
            breadcrumbBaseItems={[
                { label: "Home", href: "/" },
                { label: "Shop", href: "/shop" },
            ]}
        />
    );
}
