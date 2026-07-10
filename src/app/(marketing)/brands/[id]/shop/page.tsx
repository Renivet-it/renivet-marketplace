import { BrandShopHero } from "@/components/brands";
import { StorefrontCatalogPage } from "@/components/shop";
import { siteConfig } from "@/config/site";
import { brandCache } from "@/lib/redis/methods";
import { getAbsoluteURL } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
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

async function getActiveBrandBySlug(slug: string) {
    const brand = await brandCache.getBySlug(slug);

    if (!brand || !brand.isActive) {
        return null;
    }

    return brand;
}

export async function generateMetadata({
    params,
}: PageProps): Promise<Metadata> {
    const { id: slug } = await params;
    const brand = await getActiveBrandBySlug(slug);

    if (!brand) {
        return {
            title: "Brand shop not found",
            description: "The requested brand shop could not be found.",
        };
    }

    const title = `${brand.name} Shop`;
    const description =
        brand.bio?.trim() ||
        `Explore the ${brand.name} collection on ${siteConfig.name}.`;
    const url = getAbsoluteURL(`/brands/${brand.slug}/shop`);
    const imageUrl = brand.coverUrl || brand.logoUrl;

    return {
        title,
        description,
        alternates: {
            canonical: url,
        },
        openGraph: {
            type: "website",
            locale: "en_US",
            url,
            title,
            description,
            siteName: siteConfig.name,
            images: imageUrl
                ? [
                      {
                          url: imageUrl,
                          alt: brand.name,
                      },
                  ]
                : undefined,
        },
        twitter: {
            card: imageUrl ? "summary_large_image" : "summary",
            title,
            description,
            images: imageUrl ? [imageUrl] : undefined,
        },
    };
}

export default async function Page({ params, searchParams }: PageProps) {
    const { id: slug } = await params;
    const brand = await getActiveBrandBySlug(slug);

    if (!brand) {
        notFound();
    }

    return (
        <StorefrontCatalogPage
            searchParams={searchParams}
            basePath={`/brands/${brand.slug}/shop`}
            breadcrumbBaseItems={[
                { label: "Home", href: "/" },
                { label: brand.name, href: `/brands/${brand.id}` },
                { label: "Shop", href: `/brands/${brand.slug}/shop` },
            ]}
            hero={<BrandShopHero brand={brand} />}
            lockedBrandId={brand.id}
            hideBrandFilter
        />
    );
}
