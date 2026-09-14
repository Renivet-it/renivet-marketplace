const SCHEMA_CONTEXT = "https://schema.org" as const;
const IN_STOCK = "https://schema.org/InStock" as const;
const OUT_OF_STOCK = "https://schema.org/OutOfStock" as const;

export function serializeJsonLd(value: object): string {
    return JSON.stringify(value).replace(/</g, "\\u003c");
}

export interface SiteIdentityJsonLdInput {
    name: string;
    description: string;
    url: string;
    socialProfileUrls: ReadonlyArray<string>;
}

export interface SiteIdentityJsonLd {
    "@context": typeof SCHEMA_CONTEXT;
    "@graph": [
        {
            "@type": "Organization";
            name: string;
            description: string;
            url: string;
            sameAs: ReadonlyArray<string>;
        },
        {
            "@type": "WebSite";
            name: string;
            url: string;
        },
    ];
}

export interface BlogPostingJsonLdInput {
    blog: {
        isPublished: boolean;
        title: string;
        description: string;
        publishedAt: Date | null;
        updatedAt: Date | null;
        thumbnailUrl: string | null;
        author: {
            firstName: string;
            lastName: string;
        };
    };
    url: string;
}

export interface BlogPostingJsonLd {
    "@context": typeof SCHEMA_CONTEXT;
    "@type": "BlogPosting";
    headline: string;
    description: string;
    url: string;
    datePublished?: string;
    dateModified?: string;
    image?: string;
    author: {
        "@type": "Person";
        name: string;
    };
}

export interface ProductItemListProduct {
    id: string;
    title: string;
    slug: string;
    price: number | null;
    isAvailable: boolean;
    media: ReadonlyArray<{
        url?: string | null;
        mediaItem?: {
            url?: string | null;
        } | null;
    }>;
}

export interface ProductItemListJsonLdInput {
    name: string;
    url: string;
    products: ReadonlyArray<ProductItemListProduct>;
    productUrl: (slug: string) => string;
}

export interface ProductItemListJsonLd {
    "@context": typeof SCHEMA_CONTEXT;
    "@type": "ItemList";
    name: string;
    url: string;
    itemListElement: Array<{
        "@type": "ListItem";
        position: number;
        item: {
            "@type": "Product";
            name: string;
            url: string;
            image: string;
            offers: {
                "@type": "Offer";
                price: number;
                priceCurrency: "INR";
                availability: typeof IN_STOCK | typeof OUT_OF_STOCK;
                url: string;
            };
        };
    }>;
}

export function buildSiteIdentityJsonLd({
    name,
    description,
    url,
    socialProfileUrls,
}: SiteIdentityJsonLdInput): SiteIdentityJsonLd {
    return {
        "@context": SCHEMA_CONTEXT,
        "@graph": [
            {
                "@type": "Organization",
                name,
                description,
                url,
                sameAs: socialProfileUrls,
            },
            {
                "@type": "WebSite",
                name,
                url,
            },
        ],
    };
}

export function buildBlogPostingJsonLd({
    blog,
    url,
}: BlogPostingJsonLdInput): BlogPostingJsonLd | null {
    if (!blog.isPublished) return null;

    return {
        "@context": SCHEMA_CONTEXT,
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.description,
        url,
        ...(blog.publishedAt
            ? { datePublished: blog.publishedAt.toISOString() }
            : {}),
        ...(blog.updatedAt
            ? { dateModified: blog.updatedAt.toISOString() }
            : {}),
        ...(blog.thumbnailUrl ? { image: blog.thumbnailUrl } : {}),
        author: {
            "@type": "Person",
            name: `${blog.author.firstName} ${blog.author.lastName}`,
        },
    };
}

export function buildProductItemListJsonLd({
    name,
    url,
    products,
    productUrl,
}: ProductItemListJsonLdInput): ProductItemListJsonLd | null {
    const itemListElement: ProductItemListJsonLd["itemListElement"] = [];

    for (const product of products) {
        const image = product.media.find((media) => media.mediaItem?.url)
            ?.mediaItem?.url;
        const { price } = product;

        if (
            !product.id ||
            !product.title ||
            !product.slug ||
            !image ||
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            continue;
        }

        const productPageUrl = productUrl(product.slug);

        itemListElement.push({
            "@type": "ListItem",
            position: itemListElement.length + 1,
            item: {
                "@type": "Product",
                name: product.title,
                url: productPageUrl,
                image,
                offers: {
                    "@type": "Offer",
                    price: price / 100,
                    priceCurrency: "INR",
                    availability: product.isAvailable
                        ? IN_STOCK
                        : OUT_OF_STOCK,
                    url: productPageUrl,
                },
            },
        });
    }

    if (!itemListElement.length) return null;

    return {
        "@context": SCHEMA_CONTEXT,
        "@type": "ItemList",
        name,
        url,
        itemListElement,
    };
}
