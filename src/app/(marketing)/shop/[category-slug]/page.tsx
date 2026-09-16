import {
    StorefrontCatalogPage,
    type StorefrontSearchParams,
} from "@/components/shop";
import {
    categoryCache,
    productTypeCache,
    subCategoryCache,
} from "@/lib/redis/methods";
import { getCategoryEditorialCopy } from "@/lib/shop/category-content";
import {
    createCategoryRouteEvent,
    emitCategoryEvent,
    type CategoryRouteReason,
} from "@/lib/shop/category-telemetry";
import { getCategoryHierarchyReason } from "@/lib/shop/category-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ "category-slug": string }>;
    searchParams: Promise<StorefrontSearchParams>;
}

const isCanonicalSlug = (slug: string) => {
    try {
        return (
            slug.length > 0 &&
            slug === slug.toLowerCase() &&
            slug === decodeURIComponent(slug) &&
            !/[/?#%]/.test(slug)
        );
    } catch {
        return false;
    }
};

function logCategoryRoute(
    outcome: "rendered" | "not_found" | "error",
    slug: string,
    reason: CategoryRouteReason,
    status: number,
    categoryId?: string
) {
    emitCategoryEvent(
        createCategoryRouteEvent({
            outcome,
            reason,
            status,
            slug,
            ...(categoryId ? { categoryId } : {}),
            environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
            destinationPathname: `/shop/${slug}`,
        })
    );
}

async function resolveCategory(slug: string, params: StorefrontSearchParams) {
    if (!isCanonicalSlug(slug)) return null;
    const [categories, subCategories, productTypes] = await Promise.all([
        categoryCache.getAll(),
        subCategoryCache.getAll(),
        productTypeCache.getAll(),
    ]);
    const category = categories.find((item) => item.slug === slug);
    if (!category) return null;

    const subCategoryId = params.subCategoryId || params.subcategoryId;
    if (params.subCategoryId && params.subcategoryId) return null;
    const subCategory = subCategoryId
        ? subCategories.find((item) => item.id === subCategoryId)
        : undefined;
    const productType = params.productTypeId
        ? productTypes.find((item) => item.id === params.productTypeId)
        : undefined;
    if (
        getCategoryHierarchyReason({
            categoryId: category.id,
            requestedCategoryId: params.categoryId,
            requestedSubCategoryId: subCategoryId,
            requestedProductTypeId: params.productTypeId,
            subCategory,
            productType,
        }) !== "success"
    )
        return null;

    return {
        category,
        editorial: getCategoryEditorialCopy(category.description),
    };
}

export async function generateMetadata({
    params,
    searchParams,
}: PageProps): Promise<Metadata> {
    const { "category-slug": slug } = await params;
    const resolved = await resolveCategory(slug, await searchParams);
    if (!resolved)
        return {
            title: "Category not found",
            robots: { index: false, follow: false },
        };
    return {
        title: resolved.category.name,
        description: resolved.editorial.slice(0, 160),
        alternates: { canonical: `/shop/${resolved.category.slug}` },
    };
}

export default async function CategoryShopPage({
    params,
    searchParams,
}: PageProps) {
    const { "category-slug": slug } = await params;
    const rawParams = await searchParams;
    let resolved: Awaited<ReturnType<typeof resolveCategory>>;
    try {
        resolved = await resolveCategory(slug, rawParams);
    } catch {
        logCategoryRoute("error", slug, "server_error", 500);
        throw new Error("Unable to resolve category route");
    }
    if (!resolved) {
        const reason = !isCanonicalSlug(slug)
            ? "invalid_slug"
            : rawParams.subCategoryId && rawParams.subcategoryId
              ? "duplicate_filter"
              : rawParams.categoryId ||
                  rawParams.subCategoryId ||
                  rawParams.subcategoryId ||
                  rawParams.productTypeId
                ? "hierarchy_mismatch"
                : "unknown_slug";
        logCategoryRoute("not_found", slug, reason, 404);
        notFound();
    }
    logCategoryRoute("rendered", slug, "success", 200, resolved.category.id);

    const categoryParams = Promise.resolve({
        ...rawParams,
        categoryId: resolved.category.id,
    });

    return (
        <StorefrontCatalogPage
            searchParams={categoryParams}
            basePath={`/shop/${resolved.category.slug}`}
            breadcrumbBaseItems={[
                { label: "Home", href: "/" },
                { label: "Shop", href: "/shop" },
                {
                    label: resolved.category.name,
                    href: `/shop/${resolved.category.slug}`,
                },
            ]}
            pageHeading={`${resolved.category.name} Sustainable Products`}
            editorialIntro={resolved.editorial}
        />
    );
}
