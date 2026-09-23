import { expect, mock, test } from "bun:test";

mock.module("@/lib/python/service-url", () => ({
    buildEmbeddingServiceUrl: () => null,
}));

mock.module("@/lib/search/search-engine", () => ({
    getSuggestions: async () => [
        {
            keyword: "shirt",
            displayText: "Shirt",
            type: "productType",
            score: 900,
        },
        {
            keyword: "shirt for women",
            displayText: "Shirt for Women",
            type: "category",
            score: 600,
        },
    ],
}));

mock.module("@/lib/db/queries", () => ({
    productQueries: {
        getProducts: async () => ({
            data: [
                {
                    id: "product-1",
                    slug: "blue-shirt",
                    title: "Blue Shirt",
                    price: null,
                    variants: [{ price: 125000 }],
                    media: [
                        {
                            id: "media-1",
                            mediaItem: { url: "https://cdn.example.com/shirt.jpg" },
                        },
                    ],
                    brand: { name: "Example Brand" },
                },
            ],
        }),
    },
}));

const { GET: getSuggestions } = await import(
    "./suggestions/route"
);
const { GET: getProducts } = await import("./products/route");

test("search suggestions use the database when the embedding service is unavailable", async () => {
    const response = await getSuggestions(
        new Request("http://localhost/api/search/suggestions?query=shirts")
    );

    expect(await response.json()).toEqual(["Shirt", "Shirt for Women"]);
});

test("search product previews use the database when the embedding service is unavailable", async () => {
    const response = await getProducts(
        new Request("http://localhost/api/search/products?query=shirts")
    );

    expect(await response.json()).toEqual([
        {
            id: "product-1",
            slug: "blue-shirt",
            name: "Blue Shirt",
            price: 125000,
            media: { url: "https://cdn.example.com/shirt.jpg" },
            brand: { name: "Example Brand" },
        },
    ]);
});
