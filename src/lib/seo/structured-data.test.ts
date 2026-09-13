import { describe, expect, test } from "bun:test";
import {
    buildBlogPostingJsonLd,
    buildProductItemListJsonLd,
    buildSiteIdentityJsonLd,
    serializeJsonLd,
} from "./structured-data";

describe("buildSiteIdentityJsonLd", () => {
    test("uses only the configured site identity values", () => {
        const jsonLd = buildSiteIdentityJsonLd({
            name: "Renivet",
            description: "A marketplace for conscious consumers.",
            url: "https://www.renivet.com",
            socialProfileUrls: [
                "https://www.instagram.com/shop.renivet?igsh=NGNzamtsZ25qaDU1",
                "https://www.linkedin.com/company/renivet/",
                "https://www.youtube.com/@Renivet",
            ],
        });

        expect(jsonLd).toEqual({
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Organization",
                    name: "Renivet",
                    description: "A marketplace for conscious consumers.",
                    url: "https://www.renivet.com",
                    sameAs: [
                        "https://www.instagram.com/shop.renivet?igsh=NGNzamtsZ25qaDU1",
                        "https://www.linkedin.com/company/renivet/",
                        "https://www.youtube.com/@Renivet",
                    ],
                },
                {
                    "@type": "WebSite",
                    name: "Renivet",
                    url: "https://www.renivet.com",
                },
            ],
        });
        expect(JSON.stringify(jsonLd)).not.toContain("SearchAction");
        expect(JSON.stringify(jsonLd)).not.toContain('"#"');
    });
});

describe("buildBlogPostingJsonLd", () => {
    const publishedBlog = {
        isPublished: true,
        title: "How to choose a thoughtful Rakhi gift",
        description: "A guide to meaningful conscious gifting.",
        slug: "thoughtful-rakhi-gift",
        publishedAt: new Date("2026-08-01T10:00:00.000Z"),
        updatedAt: new Date("2026-08-03T15:30:00.000Z"),
        thumbnailUrl: "https://cdn.renivet.com/blog/rakhi.jpg",
        author: {
            firstName: "Ayan",
            lastName: "Ganguly",
        },
    };

    test("projects stored published blog dates, author, and image", () => {
        const jsonLd = buildBlogPostingJsonLd({
            blog: publishedBlog,
            url: "https://www.renivet.com/blogs/thoughtful-rakhi-gift",
        });

        expect(jsonLd).toEqual({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: "How to choose a thoughtful Rakhi gift",
            description: "A guide to meaningful conscious gifting.",
            url: "https://www.renivet.com/blogs/thoughtful-rakhi-gift",
            datePublished: "2026-08-01T10:00:00.000Z",
            dateModified: "2026-08-03T15:30:00.000Z",
            image: "https://cdn.renivet.com/blog/rakhi.jpg",
            author: {
                "@type": "Person",
                name: "Ayan Ganguly",
            },
        });
    });

    test("omits schema for unpublished blogs", () => {
        expect(
            buildBlogPostingJsonLd({
                blog: { ...publishedBlog, isPublished: false },
                url: "https://www.renivet.com/blogs/thoughtful-rakhi-gift",
            })
        ).toBeNull();
    });

    test("omits optional dates and image when the published record lacks them", () => {
        const jsonLd = buildBlogPostingJsonLd({
            blog: {
                ...publishedBlog,
                publishedAt: null,
                updatedAt: null,
                thumbnailUrl: null,
            },
            url: "https://www.renivet.com/blogs/thoughtful-rakhi-gift",
        });

        expect(jsonLd).toEqual({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: "How to choose a thoughtful Rakhi gift",
            description: "A guide to meaningful conscious gifting.",
            url: "https://www.renivet.com/blogs/thoughtful-rakhi-gift",
            author: {
                "@type": "Person",
                name: "Ayan Ganguly",
            },
        });
    });
});

describe("buildProductItemListJsonLd", () => {
    test("uses festive mediaItem URLs, real paise prices, and availability", () => {
        const jsonLd = buildProductItemListJsonLd({
            name: "Rakhi Collection",
            url: "https://www.renivet.com/festive",
            products: [
                {
                    id: "product-1",
                    title: "Handwoven Rakhi",
                    slug: "handwoven-rakhi",
                    price: 129900,
                    isAvailable: true,
                    media: [
                        {
                            mediaItem: {
                                url: "https://cdn.renivet.com/products/rakhi.jpg",
                            },
                            url: "https://incorrect.example/fallback.jpg",
                        },
                    ],
                },
                {
                    id: "product-2",
                    title: "Natural Cotton Gift Set",
                    slug: "cotton-gift-set",
                    price: 5000,
                    isAvailable: false,
                    media: [
                        {
                            mediaItem: {
                                url: "https://cdn.renivet.com/products/gift-set.jpg",
                            },
                        },
                    ],
                },
            ],
            productUrl: (slug) => `https://www.renivet.com/products/${slug}`,
        });

        expect(jsonLd).toEqual({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Rakhi Collection",
            url: "https://www.renivet.com/festive",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    item: {
                        "@type": "Product",
                        name: "Handwoven Rakhi",
                        url: "https://www.renivet.com/products/handwoven-rakhi",
                        image: "https://cdn.renivet.com/products/rakhi.jpg",
                        offers: {
                            "@type": "Offer",
                            price: 1299,
                            priceCurrency: "INR",
                            availability: "https://schema.org/InStock",
                            url: "https://www.renivet.com/products/handwoven-rakhi",
                        },
                    },
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    item: {
                        "@type": "Product",
                        name: "Natural Cotton Gift Set",
                        url: "https://www.renivet.com/products/cotton-gift-set",
                        image: "https://cdn.renivet.com/products/gift-set.jpg",
                        offers: {
                            "@type": "Offer",
                            price: 50,
                            priceCurrency: "INR",
                            availability: "https://schema.org/OutOfStock",
                            url: "https://www.renivet.com/products/cotton-gift-set",
                        },
                    },
                },
            ],
        });
        expect(JSON.stringify(jsonLd)).not.toContain("aggregateRating");
        expect(JSON.stringify(jsonLd)).not.toContain("review");
    });

    test("omits products without a public identity, price, or mediaItem URL", () => {
        const jsonLd = buildProductItemListJsonLd({
            name: "Rakhi Collection",
            url: "https://www.renivet.com/festive",
            products: [
                {
                    id: "missing-price",
                    title: "Missing price",
                    slug: "missing-price",
                    price: null,
                    isAvailable: true,
                    media: [
                        { mediaItem: { url: "https://cdn.renivet.com/a.jpg" } },
                    ],
                },
                {
                    id: "missing-media",
                    title: "Missing media",
                    slug: "missing-media",
                    price: 1000,
                    isAvailable: true,
                    media: [],
                },
                {
                    id: "missing-slug",
                    title: "Missing slug",
                    slug: "",
                    price: 1000,
                    isAvailable: true,
                    media: [
                        { mediaItem: { url: "https://cdn.renivet.com/b.jpg" } },
                    ],
                },
            ],
            productUrl: (slug) => `https://www.renivet.com/products/${slug}`,
        });

        expect(jsonLd).toBeNull();
    });

    test("numbers retained products contiguously after invalid products are omitted", () => {
        const jsonLd = buildProductItemListJsonLd({
            name: "Rakhi Collection",
            url: "https://www.renivet.com/festive",
            products: [
                {
                    id: "missing-media",
                    title: "Missing media",
                    slug: "missing-media",
                    price: 2500,
                    isAvailable: true,
                    media: [],
                },
                {
                    id: "product-1",
                    title: "Handmade Rakhi",
                    slug: "handmade-rakhi",
                    price: 2500,
                    isAvailable: true,
                    media: [
                        {
                            mediaItem: {
                                url: "https://cdn.renivet.com/products/handmade-rakhi.jpg",
                            },
                        },
                    ],
                },
            ],
            productUrl: (slug) => `https://www.renivet.com/products/${slug}`,
        });

        expect(jsonLd?.itemListElement).toHaveLength(1);
        expect(jsonLd?.itemListElement[0]?.position).toBe(1);
    });
});

describe("serializeJsonLd", () => {
    test("escapes product data that could close a JSON-LD script tag", () => {
        const jsonLd = buildProductItemListJsonLd({
            name: "Rakhi Collection",
            url: "https://www.renivet.com/festive",
            products: [
                {
                    id: "malicious-product",
                    title: "Rakhi </script><script>alert(1)</script>",
                    slug: "malicious-product",
                    price: 2500,
                    isAvailable: true,
                    media: [
                        {
                            mediaItem: {
                                url: "https://cdn.renivet.com/</script><script>alert(1)</script>.jpg",
                            },
                        },
                    ],
                },
            ],
            productUrl: (slug) => `https://www.renivet.com/products/${slug}`,
        });

        if (!jsonLd) {
            throw new Error("Expected a product ItemList JSON-LD payload");
        }

        const serialized = serializeJsonLd(jsonLd);

        expect(serialized).not.toContain("</script>");
        expect(serialized).toContain("\\u003c/script>");
    });
});
