import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
    brandAliases,
    brands,
    searchAnalytics,
    searchIntents,
} from "../db/schema";

/**
 * Search Engine Flow - Phase 1
 * Implements Stages 1-6 of the search engine flow document
 */

// ============================================
// TYPES
// ============================================

export type IntentType =
    | "BRAND"
    | "CATEGORY"
    | "SUBCATEGORY"
    | "PRODUCT_TYPE"
    | "UNKNOWN";

export interface SearchResult {
    intentType: IntentType;
    brandId?: string;
    brandSlug?: string;
    brandName?: string;
    categoryId?: string;
    categorySlug?: string;
    subcategoryId?: string;
    subcategorySlug?: string;
    productTypeId?: string;
    productTypeSlug?: string;
    normalizedQuery: string;
    originalQuery: string;
    confidence: "high" | "medium" | "low";
}

interface BrandData {
    id: string;
    name: string;
    slug: string;
}

interface CategoryData {
    id: string;
    name: string;
    slug: string;
}

interface SubCategoryData {
    id: string;
    name: string;
    slug: string;
    categoryId: string;
}

interface ProductTypeData {
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    subCategoryId: string;
}

interface IntentMapping {
    id: string;
    keyword: string;
    intentType: "CATEGORY" | "PRODUCT" | "BRAND";
    categoryIds: string;
    priority: string;
    source: string;
}

// ============================================
// STAGE 2: QUERY NORMALIZATION
// ============================================

/**
 * Normalizes a search query:
 * - Convert to lowercase
 * - Trim spaces
 * - Remove noise characters (keep alphanumeric, spaces, &)
 * - Collapse multiple spaces
 */
export function normalizeQuery(query: string): string {
    return query
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s&]/gi, "") // Remove noise chars except &
        .replace(/\s+/g, " ") // Collapse multiple spaces
        .trim();
}

/**
 * Tokenize query into words
 */
export function tokenizeQuery(query: string): string[] {
    return query.split(" ").filter((word) => word.length > 0);
}

// ============================================
// STAGE 3: BRAND INTENT DETECTION
// ============================================

/**
 * Check if query matches a brand (exact, alias, or partial)
 */
export async function detectBrandIntent(
    normalizedQuery: string,
    brandsData: BrandData[]
): Promise<{
    matched: boolean;
    brand?: BrandData;
    matchType?: "exact" | "alias" | "partial";
}> {
    // 1. Exact match check (brand name or slug)
    for (const brand of brandsData) {
        const brandNameLower = brand.name.toLowerCase();
        const brandSlugLower = brand.slug.toLowerCase();

        if (
            normalizedQuery === brandNameLower ||
            normalizedQuery === brandSlugLower
        ) {
            return { matched: true, brand, matchType: "exact" };
        }
    }

    // 2. Check aliases from database
    const aliasMatch = await db.query.brandAliases.findFirst({
        where: eq(brandAliases.alias, normalizedQuery),
        with: {
            brand: true,
        },
    });

    if (aliasMatch?.brand) {
        const brand = brandsData.find((b) => b.id === aliasMatch.brandId);
        if (brand) {
            return { matched: true, brand, matchType: "alias" };
        }
    }

    // 3. Partial match check (brand name is contained in query or vice versa)
    for (const brand of brandsData) {
        const brandNameLower = brand.name.toLowerCase();

        // Brand name is a substring of query
        if (
            normalizedQuery.includes(brandNameLower) &&
            brandNameLower.length >= 3
        ) {
            return { matched: true, brand, matchType: "partial" };
        }

        // Query is a substring of brand name (for short queries)
        if (
            brandNameLower.includes(normalizedQuery) &&
            normalizedQuery.length >= 4
        ) {
            return { matched: true, brand, matchType: "partial" };
        }
    }

    return { matched: false };
}

// ============================================
// STAGE 4: CATEGORY / PRODUCT INTENT DETECTION
// ============================================

/**
 * Check if query matches a search intent from the database
 */
export async function detectIntentFromMapping(
    normalizedQuery: string
): Promise<{ matched: boolean; intent?: IntentMapping }> {
    // Check exact match first
    const exactMatch = await db.query.searchIntents.findFirst({
        where: eq(searchIntents.keyword, normalizedQuery),
    });

    if (exactMatch) {
        return { matched: true, intent: exactMatch };
    }

    // Check partial matches (query contains keyword or keyword contains query)
    const allIntents = await db.query.searchIntents.findMany();

    for (const intent of allIntents) {
        if (
            normalizedQuery.includes(intent.keyword) ||
            intent.keyword.includes(normalizedQuery)
        ) {
            return { matched: true, intent };
        }
    }

    return { matched: false };
}

/**
 * Fallback detection using category/subcategory/productType names directly
 */
export async function detectCategoryIntentFallback(
    normalizedQuery: string,
    categoriesData: CategoryData[],
    subCategoriesData: SubCategoryData[],
    productTypesData: ProductTypeData[]
): Promise<{
    matched: boolean;
    type?: "CATEGORY" | "SUBCATEGORY" | "PRODUCT_TYPE";
    data?: CategoryData | SubCategoryData | ProductTypeData;
}> {
    // Check product types first (most specific)
    for (const pt of productTypesData) {
        const ptNameLower = pt.name.toLowerCase();
        if (
            normalizedQuery === ptNameLower ||
            normalizedQuery.includes(ptNameLower)
        ) {
            return { matched: true, type: "PRODUCT_TYPE", data: pt };
        }
    }

    // Check subcategories
    for (const sc of subCategoriesData) {
        const scNameLower = sc.name.toLowerCase();
        if (
            normalizedQuery === scNameLower ||
            normalizedQuery.includes(scNameLower)
        ) {
            return { matched: true, type: "SUBCATEGORY", data: sc };
        }
    }

    // Check categories (least specific)
    for (const cat of categoriesData) {
        const catNameLower = cat.name.toLowerCase();
        if (
            normalizedQuery === catNameLower ||
            normalizedQuery.includes(catNameLower)
        ) {
            return { matched: true, type: "CATEGORY", data: cat };
        }
    }

    return { matched: false };
}

// ============================================
// STAGE 5 & 6: INTENT CLASSIFICATION & ROUTING
// ============================================

/**
 * Main search orchestrator - processes query and returns intent result
 */
export async function processSearch(query: string): Promise<SearchResult> {
    const originalQuery = query;
    const normalizedQuery = normalizeQuery(query);

    if (!normalizedQuery) {
        return {
            intentType: "UNKNOWN",
            normalizedQuery: "",
            originalQuery,
            confidence: "low",
        };
    }

    // Fetch all required data
    const [brandsData, categoriesData, subCategoriesData, productTypesData] =
        await Promise.all([
            db.query.brands.findMany({
                columns: { id: true, name: true, slug: true },
                where: eq(brands.isActive, true),
            }),
            db.query.categories.findMany({
                columns: { id: true, name: true, slug: true },
            }),
            db.query.subCategories.findMany({
                columns: { id: true, name: true, slug: true, categoryId: true },
            }),
            db.query.productTypes.findMany({
                columns: {
                    id: true,
                    name: true,
                    slug: true,
                    categoryId: true,
                    subCategoryId: true,
                },
            }),
        ]);

    // STAGE 3: Brand Intent Detection (HIGHEST PRIORITY)
    const brandResult = await detectBrandIntent(normalizedQuery, brandsData);
    if (brandResult.matched && brandResult.brand) {
        return {
            intentType: "BRAND",
            brandId: brandResult.brand.id,
            brandSlug: brandResult.brand.slug,
            brandName: brandResult.brand.name,
            normalizedQuery,
            originalQuery,
            confidence: brandResult.matchType === "exact" ? "high" : "medium",
        };
    }

    // STAGE 4: Check intent mapping table first
    const intentResult = await detectIntentFromMapping(normalizedQuery);
    if (intentResult.matched && intentResult.intent) {
        const intent = intentResult.intent;
        const categoryPath = intent.categoryIds.split("|");

        // Parse category path to find the most specific match
        if (categoryPath.length >= 2) {
            // Has subcategory
            const categoryName = categoryPath[0];
            const subcategoryName = categoryPath[1];

            const category = categoriesData.find(
                (c) => c.name.toLowerCase() === categoryName.toLowerCase()
            );
            const subcategory = subCategoriesData.find(
                (sc) => sc.name.toLowerCase() === subcategoryName.toLowerCase()
            );

            if (subcategory) {
                // Check if there's a product type match
                if (
                    intent.intentType === "PRODUCT" &&
                    categoryPath.length >= 2
                ) {
                    const productType = productTypesData.find(
                        (pt) =>
                            pt.subCategoryId === subcategory.id &&
                            pt.name.toLowerCase().includes(normalizedQuery)
                    );
                    if (productType) {
                        return {
                            intentType: "PRODUCT_TYPE",
                            productTypeId: productType.id,
                            productTypeSlug: productType.slug,
                            subcategoryId: subcategory.id,
                            subcategorySlug: subcategory.slug,
                            categoryId: category?.id,
                            categorySlug: category?.slug,
                            normalizedQuery,
                            originalQuery,
                            confidence:
                                intent.priority === "high" ? "high" : "medium",
                        };
                    }
                }

                return {
                    intentType: "SUBCATEGORY",
                    subcategoryId: subcategory.id,
                    subcategorySlug: subcategory.slug,
                    categoryId: category?.id,
                    categorySlug: category?.slug,
                    normalizedQuery,
                    originalQuery,
                    confidence: intent.priority === "high" ? "high" : "medium",
                };
            }

            if (category) {
                return {
                    intentType: "CATEGORY",
                    categoryId: category.id,
                    categorySlug: category.slug,
                    normalizedQuery,
                    originalQuery,
                    confidence: intent.priority === "high" ? "high" : "medium",
                };
            }
        }
    }

    // Fallback: Direct category/subcategory/productType name matching
    const fallbackResult = await detectCategoryIntentFallback(
        normalizedQuery,
        categoriesData,
        subCategoriesData,
        productTypesData
    );

    if (fallbackResult.matched && fallbackResult.data) {
        if (fallbackResult.type === "PRODUCT_TYPE") {
            const pt = fallbackResult.data as ProductTypeData;
            const sc = subCategoriesData.find((s) => s.id === pt.subCategoryId);
            const cat = categoriesData.find((c) => c.id === pt.categoryId);
            return {
                intentType: "PRODUCT_TYPE",
                productTypeId: pt.id,
                productTypeSlug: pt.slug,
                subcategoryId: sc?.id,
                subcategorySlug: sc?.slug,
                categoryId: cat?.id,
                categorySlug: cat?.slug,
                normalizedQuery,
                originalQuery,
                confidence: "medium",
            };
        }

        if (fallbackResult.type === "SUBCATEGORY") {
            const sc = fallbackResult.data as SubCategoryData;
            const cat = categoriesData.find((c) => c.id === sc.categoryId);
            return {
                intentType: "SUBCATEGORY",
                subcategoryId: sc.id,
                subcategorySlug: sc.slug,
                categoryId: cat?.id,
                categorySlug: cat?.slug,
                normalizedQuery,
                originalQuery,
                confidence: "medium",
            };
        }

        if (fallbackResult.type === "CATEGORY") {
            const cat = fallbackResult.data as CategoryData;
            return {
                intentType: "CATEGORY",
                categoryId: cat.id,
                categorySlug: cat.slug,
                normalizedQuery,
                originalQuery,
                confidence: "medium",
            };
        }
    }

    // UNKNOWN intent - will trigger global semantic search
    return {
        intentType: "UNKNOWN",
        normalizedQuery,
        originalQuery,
        confidence: "low",
    };
}

// ============================================
// STAGE 10: ANALYTICS LOGGING
// ============================================

/**
 * Log search query for analytics
 */
export async function logSearchQuery(
    result: SearchResult,
    sessionId?: string,
    userId?: string,
    resultCount?: number
) {
    try {
        await db.insert(searchAnalytics).values({
            originalQuery: result.originalQuery,
            normalizedQuery: result.normalizedQuery,
            intentType:
                result.intentType === "PRODUCT_TYPE"
                    ? "PRODUCT"
                    : result.intentType === "SUBCATEGORY"
                      ? "CATEGORY"
                      : result.intentType,
            matchedBrandId: result.brandId,
            matchedCategoryId: result.categoryId,
            matchedSubcategoryId: result.subcategoryId,
            matchedProductTypeId: result.productTypeId,
            sessionId,
            userId,
            resultCount: resultCount?.toString(),
        });
    } catch (error) {
        console.error("Failed to log search query:", error);
    }
}

// ============================================
// ROUTING HELPERS
// ============================================

/**
 * Generate the URL path based on search result
 */
export function getSearchRedirectUrl(result: SearchResult): string {
    switch (result.intentType) {
        case "BRAND":
            return `/brands/${result.brandSlug}`;

        case "CATEGORY":
            return `/shop?categoryId=${result.categoryId}`;

        case "SUBCATEGORY":
            return `/shop?subcategoryId=${result.subcategoryId}`;

        case "PRODUCT_TYPE":
            return `/shop?productTypeId=${result.productTypeId}`;

        case "UNKNOWN":
        default:
            return `/shop?search=${encodeURIComponent(result.originalQuery)}`;
    }
}

/**
 * Get UI copy based on intent type (per rulebook Section G)
 */
export function getSearchCopy(result: SearchResult): string {
    switch (result.intentType) {
        case "BRAND":
            return `Products from ${result.brandName || "Brand"}`;

        case "CATEGORY":
        case "SUBCATEGORY":
        case "PRODUCT_TYPE":
            return `Results for "${result.originalQuery}"`;

        case "UNKNOWN":
        default:
            return result.confidence === "low"
                ? "Popular on Renivet"
                : `Based on your search`;
    }
}

// ============================================
// SEARCH SUGGESTIONS
// ============================================

export interface SearchSuggestion {
    keyword: string;
    intentType: "CATEGORY" | "PRODUCT" | "BRAND";
    categoryPath: string;
    displayText: string;
}

/**
 * Get search suggestions based on partial query
 * Returns matching keywords from search_intents table
 */
export async function getSuggestions(
    query: string,
    limit: number = 6
): Promise<SearchSuggestion[]> {
    const normalizedQuery = normalizeQuery(query);

    if (!normalizedQuery || normalizedQuery.length < 2) {
        return [];
    }

    try {
        // Fetch all intents and filter in memory for flexibility
        const allIntents = await db.query.searchIntents.findMany();

        // Filter intents that match the query
        const matchingIntents = allIntents
            .filter((intent) => {
                const keyword = intent.keyword.toLowerCase();
                // Match if keyword starts with query or contains query
                return (
                    keyword.startsWith(normalizedQuery) ||
                    keyword.includes(normalizedQuery) ||
                    normalizedQuery.includes(keyword)
                );
            })
            // Sort by priority and relevance
            .sort((a, b) => {
                // Prioritize exact matches
                if (a.keyword === normalizedQuery) return -1;
                if (b.keyword === normalizedQuery) return 1;

                // Then by priority
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const aPriority =
                    priorityOrder[a.priority as keyof typeof priorityOrder] ??
                    1;
                const bPriority =
                    priorityOrder[b.priority as keyof typeof priorityOrder] ??
                    1;
                if (aPriority !== bPriority) return aPriority - bPriority;

                // Then by how close the match is
                const aStartsWith = a.keyword.startsWith(normalizedQuery);
                const bStartsWith = b.keyword.startsWith(normalizedQuery);
                if (aStartsWith && !bStartsWith) return -1;
                if (!aStartsWith && bStartsWith) return 1;

                return a.keyword.length - b.keyword.length;
            })
            .slice(0, limit);

        // Format suggestions
        return matchingIntents.map((intent) => {
            const categoryPath = intent.categoryIds;
            const parts = categoryPath.split("|");
            const displayCategory =
                parts.length > 1 ? parts[parts.length - 1] : parts[0];

            return {
                keyword: intent.keyword,
                intentType: intent.intentType as
                    | "CATEGORY"
                    | "PRODUCT"
                    | "BRAND",
                categoryPath: categoryPath,
                displayText:
                    intent.intentType === "CATEGORY"
                        ? `${intent.keyword} in ${displayCategory}`
                        : `${intent.keyword} - ${displayCategory}`,
            };
        });
    } catch (error) {
        console.error("Error getting suggestions:", error);
        return [];
    }
}
