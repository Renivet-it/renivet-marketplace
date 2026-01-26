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
// SEARCH SUGGESTIONS (MYNTRA-STYLE)
// ============================================

export interface SearchSuggestion {
    keyword: string;
    displayText: string;
    type:
        | "all"
        | "category"
        | "subcategory"
        | "productType"
        | "brand"
        | "searchIntent";
    categoryId?: string;
    subcategoryId?: string;
    productTypeId?: string;
    brandId?: string;
    brandSlug?: string;
    score: number;
}

/**
 * Get Myntra-style search suggestions
 * Dynamically generates suggestions by combining query with categories, subcategories, and product types
 */
export async function getSuggestions(
    query: string,
    limit: number = 10
): Promise<SearchSuggestion[]> {
    const normalizedQuery = normalizeQuery(query);

    if (!normalizedQuery || normalizedQuery.length < 2) {
        return [];
    }

    try {
        // Fetch all category data
        const [
            categoriesData,
            subCategoriesData,
            productTypesData,
            brandsData,
        ] = await Promise.all([
            db.query.categories.findMany({
                columns: { id: true, name: true, slug: true },
            }),
            db.query.subCategories.findMany({
                columns: { id: true, name: true, slug: true, categoryId: true },
                with: {
                    category: { columns: { name: true } },
                },
            }),
            db.query.productTypes.findMany({
                columns: {
                    id: true,
                    name: true,
                    slug: true,
                    categoryId: true,
                    subCategoryId: true,
                },
                with: {
                    category: { columns: { name: true } },
                    subCategory: { columns: { name: true } },
                },
            }),
            db.query.brands.findMany({
                columns: { id: true, name: true, slug: true },
                where: eq(brands.isActive, true),
            }),
        ]);

        const suggestions: SearchSuggestion[] = [];
        const tokens = tokenizeQuery(normalizedQuery);
        const firstToken = tokens[0] || normalizedQuery;

        // Helper to capitalize words
        const capitalize = (str: string) =>
            str.replace(/\b\w/g, (c) => c.toUpperCase());

        // Check if query matches a category name (exact or partial)
        const matchedCategory = categoriesData.find(
            (cat) =>
                cat.name.toLowerCase() === normalizedQuery ||
                cat.name.toLowerCase().includes(normalizedQuery) ||
                normalizedQuery.includes(cat.name.toLowerCase())
        );

        // Check if query matches a subcategory name
        const matchedSubcategory = subCategoriesData.find(
            (sc) =>
                sc.name.toLowerCase() === normalizedQuery ||
                sc.name.toLowerCase().includes(normalizedQuery)
        );

        // Get all category names for semantic validation
        const categoryNames = new Set(
            categoriesData.map((c) => c.name.toLowerCase())
        );

        // 1. Add "All Others" option first (global search)
        suggestions.push({
            keyword: normalizedQuery,
            displayText: capitalize(normalizedQuery),
            type: "all",
            score: 1000, // Highest priority
        });

        // 2. If query matches a category, show subcategories and product types FOR that category
        if (matchedCategory) {
            const catId = matchedCategory.id;
            const catName = matchedCategory.name;

            // Show the category itself first
            suggestions.push({
                keyword: catName,
                displayText: `${capitalize(catName)} (Category)`,
                type: "category",
                categoryId: catId,
                score: 950,
            });

            // Show subcategories under this category
            const relatedSubcategories = subCategoriesData.filter(
                (sc) => sc.categoryId === catId
            );
            for (const sc of relatedSubcategories) {
                suggestions.push({
                    keyword: sc.name,
                    displayText: `${capitalize(catName)} - ${capitalize(sc.name)}`,
                    type: "subcategory",
                    subcategoryId: sc.id,
                    categoryId: catId,
                    score: 900 - sc.name.length,
                });
            }

            // Show product types under this category
            const relatedProductTypes = productTypesData.filter(
                (pt) => pt.categoryId === catId
            );
            for (const pt of relatedProductTypes) {
                const scName = (pt as any).subCategory?.name || "";
                suggestions.push({
                    keyword: pt.name,
                    displayText: scName
                        ? `${capitalize(catName)} - ${capitalize(scName)} - ${capitalize(pt.name)}`
                        : `${capitalize(catName)} - ${capitalize(pt.name)}`,
                    type: "productType",
                    productTypeId: pt.id,
                    score: 850 - pt.name.length,
                });
            }
        }

        // 3. If query matches a subcategory, show product types for that subcategory
        if (matchedSubcategory && !matchedCategory) {
            const scId = matchedSubcategory.id;
            const scName = matchedSubcategory.name;
            const catName = (matchedSubcategory as any).category?.name || "";

            // Show the subcategory itself
            suggestions.push({
                keyword: scName,
                displayText: catName
                    ? `${capitalize(catName)} - ${capitalize(scName)}`
                    : capitalize(scName),
                type: "subcategory",
                subcategoryId: scId,
                categoryId: matchedSubcategory.categoryId,
                score: 920,
            });

            // Show product types under this subcategory
            const relatedProductTypes = productTypesData.filter(
                (pt) => pt.subCategoryId === scId
            );
            for (const pt of relatedProductTypes) {
                suggestions.push({
                    keyword: pt.name,
                    displayText: `${capitalize(scName)} - ${capitalize(pt.name)}`,
                    type: "productType",
                    productTypeId: pt.id,
                    score: 880 - pt.name.length,
                });
            }
        }

        // 4. Check for exact/partial product type matches
        for (const pt of productTypesData) {
            const ptNameLower = pt.name.toLowerCase();
            if (
                ptNameLower.includes(normalizedQuery) ||
                normalizedQuery.includes(ptNameLower)
            ) {
                const exactMatch = ptNameLower === normalizedQuery;
                const catName = (pt as any).category?.name || "";

                suggestions.push({
                    keyword: pt.name,
                    displayText: catName
                        ? `${capitalize(pt.name)} in ${capitalize(catName)}`
                        : capitalize(pt.name),
                    type: "productType",
                    productTypeId: pt.id,
                    score: exactMatch ? 900 : 800 - ptNameLower.length,
                });
            }
        }

        // 5. Check for brand matches
        for (const brand of brandsData) {
            const brandNameLower = brand.name.toLowerCase();
            if (
                brandNameLower.includes(normalizedQuery) ||
                normalizedQuery.includes(brandNameLower)
            ) {
                suggestions.push({
                    keyword: brand.name,
                    displayText: `${capitalize(brand.name)} (Brand)`,
                    type: "brand",
                    brandId: brand.id,
                    brandSlug: brand.slug,
                    score: 870,
                });
            }
        }

        // 6. Only generate "Query For Category" combinations if query is NOT a category/subcategory
        //    AND the combination makes semantic sense (query is likely a product type)
        if (!matchedCategory && !matchedSubcategory) {
            // Check if query looks like a product type (not already a category name)
            const isLikelyProductType = !categoryNames.has(normalizedQuery);

            if (isLikelyProductType) {
                for (const cat of categoriesData) {
                    const catNameLower = cat.name.toLowerCase();
                    // Skip if category name is too similar to the query itself
                    if (catNameLower === normalizedQuery) continue;

                    const displayText = `${capitalize(firstToken)} for ${capitalize(cat.name)}`;
                    suggestions.push({
                        keyword: `${firstToken} for ${catNameLower}`,
                        displayText,
                        type: "category",
                        categoryId: cat.id,
                        score: 600,
                    });
                }
            }
        }

        // 7. Also check searchIntents table for any manual mappings
        const allIntents = await db.query.searchIntents.findMany();
        for (const intent of allIntents) {
            const keyword = intent.keyword.toLowerCase();
            if (
                keyword.startsWith(normalizedQuery) ||
                keyword.includes(normalizedQuery)
            ) {
                suggestions.push({
                    keyword: intent.keyword,
                    displayText: capitalize(intent.keyword),
                    type: "searchIntent",
                    score: 400,
                });
            }
        }

        // Sort by score (descending) and remove duplicates
        const seen = new Set<string>();
        const uniqueSuggestions = suggestions
            .sort((a, b) => b.score - a.score)
            .filter((s) => {
                const key = s.displayText.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .slice(0, limit);

        return uniqueSuggestions;
    } catch (error) {
        console.error("Error getting suggestions:", error);
        return [];
    }
}
