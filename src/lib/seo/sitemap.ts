import type { MetadataRoute } from "next";

export const SITEMAP_PAGE_SIZE = 50_000;

type SitemapEntry = MetadataRoute.Sitemap[number];

export interface SitemapProduct {
    id: string;
    slug: string;
    updatedAt: Date;
    isActive: boolean;
    isAvailable: boolean;
    isPublished: boolean;
    isDeleted: boolean;
    verificationStatus: string;
    brandIsActive: boolean;
}

export interface SitemapBlog {
    id: string;
    slug: string;
    updatedAt: Date;
    isPublished: boolean;
}

export interface SitemapBrand {
    id: string;
    updatedAt: Date;
    isActive: boolean;
}

export interface SitemapDataSource {
    countProducts(): Promise<number>;
    countBlogs(): Promise<number>;
    countBrands(): Promise<number>;
    findProducts(window: SitemapQueryWindow): Promise<SitemapProduct[]>;
    findBlogs(window: SitemapQueryWindow): Promise<SitemapBlog[]>;
    findBrands(window: SitemapQueryWindow): Promise<SitemapBrand[]>;
}

export interface SitemapQueryWindow {
    limit: number;
    offset: number;
}

export interface SitemapQueryWindows {
    static: SitemapQueryWindow;
    products: SitemapQueryWindow;
    blogs: SitemapQueryWindow;
    brands: SitemapQueryWindow;
}

export interface SitemapCounts {
    productCount: number;
    blogCount: number;
    brandCount: number;
}

interface SitemapCandidate {
    entry: SitemapEntry;
    stableKey: string;
}

const DEFAULT_STATIC_ENTRIES: SitemapEntry[] = [
    {
        url: "https://www.renivet.com/",
        changeFrequency: "daily",
        priority: 1,
    },
    {
        url: "https://www.renivet.com/shop",
        changeFrequency: "weekly",
        priority: 0.8,
    },
    {
        url: "https://www.renivet.com/festive",
        changeFrequency: "daily",
        priority: 0.9,
    },
    {
        url: "https://www.renivet.com/swap-passport",
        changeFrequency: "daily",
        priority: 0.9,
    },
];

function compareStrings(left: string, right: string) {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
}

function assertNonNegativeInteger(value: number, name: string) {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new RangeError(`${name} must be a non-negative safe integer.`);
    }
}

function normalizeCanonicalBaseUrl(baseUrl: string) {
    const parsed = new URL(baseUrl);

    if (
        parsed.protocol !== "https:" ||
        parsed.pathname !== "/" ||
        parsed.search ||
        parsed.hash ||
        parsed.username ||
        parsed.password
    ) {
        throw new Error("Sitemap base URL must be an absolute HTTPS origin.");
    }

    return parsed.origin;
}

function isPublicProduct(product: SitemapProduct) {
    return (
        Boolean(product.slug) &&
        product.isActive &&
        product.isAvailable &&
        product.isPublished &&
        !product.isDeleted &&
        product.verificationStatus === "approved" &&
        product.brandIsActive
    );
}

function isCanonicalStaticEntry(entry: SitemapEntry, baseUrl: string) {
    const parsed = new URL(entry.url);

    return (
        parsed.origin === baseUrl &&
        parsed.protocol === "https:" &&
        !parsed.search &&
        !parsed.hash
    );
}

function escapeXml(value: string) {
    return value.replace(
        /[<>&'\"]/g,
        (character) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&apos;",
            })[character] ?? character
    );
}

function serializeLastModified(value: string | Date) {
    return value instanceof Date ? value.toISOString() : value;
}

export function renderSitemapIndexXml({
    baseUrl,
    pageCount,
}: {
    baseUrl: string;
    pageCount: number;
}) {
    const canonicalBaseUrl = normalizeCanonicalBaseUrl(baseUrl);
    assertNonNegativeInteger(pageCount, "pageCount");

    if (pageCount === 0) {
        throw new RangeError("pageCount must be at least 1.");
    }

    const sitemapUrls = Array.from(
        { length: pageCount },
        (_, pageId) => `${canonicalBaseUrl}/sitemap/${pageId}.xml`
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
    .map((url) => `<sitemap>\n<loc>${escapeXml(url)}</loc>\n</sitemap>`)
    .join("\n")}
</sitemapindex>
`;
}

export function renderSitemapXml(entries: MetadataRoute.Sitemap) {
    const content = entries
        .map((entry) => {
            const lines = ["<url>", `<loc>${escapeXml(entry.url)}</loc>`];

            if (entry.lastModified) {
                lines.push(
                    `<lastmod>${escapeXml(serializeLastModified(entry.lastModified))}</lastmod>`
                );
            }
            if (entry.changeFrequency) {
                lines.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
            }
            if (typeof entry.priority === "number") {
                lines.push(`<priority>${entry.priority}</priority>`);
            }

            lines.push("</url>");
            return lines.join("\n");
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${content}
</urlset>
`;
}

function intersectWindow({
    start,
    end,
    groupStart,
    groupSize,
}: {
    start: number;
    end: number;
    groupStart: number;
    groupSize: number;
}): SitemapQueryWindow {
    const groupEnd = groupStart + groupSize;
    const intersectionStart = Math.max(start, groupStart);
    const intersectionEnd = Math.min(end, groupEnd);

    return {
        offset: Math.min(Math.max(start - groupStart, 0), groupSize),
        limit: Math.max(intersectionEnd - intersectionStart, 0),
    };
}

export function getSitemapPageCount(entryCount: number) {
    assertNonNegativeInteger(entryCount, "entryCount");
    return Math.max(1, Math.ceil(entryCount / SITEMAP_PAGE_SIZE));
}

export function getSitemapQueryWindows({
    pageId,
    staticEntryCount,
    productCount,
    blogCount,
    brandCount,
}: SitemapCounts & {
    pageId: number;
    staticEntryCount: number;
}): SitemapQueryWindows {
    assertNonNegativeInteger(pageId, "pageId");
    assertNonNegativeInteger(staticEntryCount, "staticEntryCount");
    assertNonNegativeInteger(productCount, "productCount");
    assertNonNegativeInteger(blogCount, "blogCount");
    assertNonNegativeInteger(brandCount, "brandCount");

    const entryCount = staticEntryCount + productCount + blogCount + brandCount;
    const pageCount = getSitemapPageCount(entryCount);

    if (pageId >= pageCount) {
        throw new RangeError(`Sitemap shard ${pageId} does not exist.`);
    }

    const start = pageId * SITEMAP_PAGE_SIZE;
    const end = Math.min(start + SITEMAP_PAGE_SIZE, entryCount);
    const productStart = staticEntryCount;
    const blogStart = productStart + productCount;
    const brandStart = blogStart + blogCount;

    return {
        static: intersectWindow({
            start,
            end,
            groupStart: 0,
            groupSize: staticEntryCount,
        }),
        products: intersectWindow({
            start,
            end,
            groupStart: productStart,
            groupSize: productCount,
        }),
        blogs: intersectWindow({
            start,
            end,
            groupStart: blogStart,
            groupSize: blogCount,
        }),
        brands: intersectWindow({
            start,
            end,
            groupStart: brandStart,
            groupSize: brandCount,
        }),
    };
}

export function buildSitemapEntries({
    baseUrl,
    staticEntries = DEFAULT_STATIC_ENTRIES,
    products = [],
    blogs = [],
    brands = [],
}: {
    baseUrl: string;
    staticEntries?: SitemapEntry[];
    products?: SitemapProduct[];
    blogs?: SitemapBlog[];
    brands?: SitemapBrand[];
}): MetadataRoute.Sitemap {
    const canonicalBaseUrl = normalizeCanonicalBaseUrl(baseUrl);
    const candidates: SitemapCandidate[] = [];

    for (const entry of staticEntries) {
        if (!isCanonicalStaticEntry(entry, canonicalBaseUrl)) continue;
        candidates.push({ entry, stableKey: `static:${entry.url}` });
    }

    for (const product of products) {
        if (!isPublicProduct(product)) continue;
        const url = `${canonicalBaseUrl}/products/${encodeURIComponent(product.slug)}`;
        candidates.push({
            entry: {
                url,
                lastModified: product.updatedAt,
                changeFrequency: "weekly",
                priority: 0.8,
            },
            stableKey: `product:${product.id}`,
        });
    }

    for (const blog of blogs) {
        if (!blog.isPublished || !blog.slug) continue;
        const url = `${canonicalBaseUrl}/blogs/${encodeURIComponent(blog.slug)}`;
        candidates.push({
            entry: {
                url,
                lastModified: blog.updatedAt,
                changeFrequency: "monthly",
                priority: 0.6,
            },
            stableKey: `blog:${blog.id}`,
        });
    }

    for (const brand of brands) {
        if (!brand.isActive || !brand.id) continue;
        const url = `${canonicalBaseUrl}/brands/${encodeURIComponent(brand.id)}`;
        candidates.push({
            entry: {
                url,
                lastModified: brand.updatedAt,
                changeFrequency: "weekly",
                priority: 0.7,
            },
            stableKey: `brand:${brand.id}`,
        });
    }

    candidates.sort(
        (left, right) =>
            compareStrings(left.entry.url, right.entry.url) ||
            compareStrings(left.stableKey, right.stableKey)
    );

    const uniqueEntries = new Map<string, SitemapEntry>();
    for (const candidate of candidates) {
        if (!uniqueEntries.has(candidate.entry.url)) {
            uniqueEntries.set(candidate.entry.url, candidate.entry);
        }
    }

    return [...uniqueEntries.values()];
}

export async function loadSitemapShard({
    baseUrl,
    pageId,
    source,
}: {
    baseUrl: string;
    pageId: number;
    source: SitemapDataSource;
}): Promise<MetadataRoute.Sitemap> {
    const [productCount, blogCount, brandCount] = await Promise.all([
        source.countProducts(),
        source.countBlogs(),
        source.countBrands(),
    ]);
    const staticEntries = buildSitemapEntries({ baseUrl });
    const windows = getSitemapQueryWindows({
        pageId,
        staticEntryCount: staticEntries.length,
        productCount,
        blogCount,
        brandCount,
    });
    const [products, blogs, brands] = await Promise.all([
        windows.products.limit
            ? source.findProducts(windows.products)
            : Promise.resolve([]),
        windows.blogs.limit
            ? source.findBlogs(windows.blogs)
            : Promise.resolve([]),
        windows.brands.limit
            ? source.findBrands(windows.brands)
            : Promise.resolve([]),
    ]);

    return buildSitemapEntries({
        baseUrl,
        staticEntries: staticEntries.slice(
            windows.static.offset,
            windows.static.offset + windows.static.limit
        ),
        products,
        blogs,
        brands,
    });
}
