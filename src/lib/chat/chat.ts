import { db } from "@/lib/db";
import { getEmbedding768 } from "@/lib/python/sematic-search";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql } from "drizzle-orm";

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI | null {
    if (!_genAI) {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GOOGLE_GEMINI_API_KEY is not configured");
            return null;
        }
        _genAI = new GoogleGenerativeAI(apiKey);
    }
    return _genAI;
}

// ---------- Types ----------

export interface ChatProduct {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    price: number | null;
    compareAtPrice: number | null;
    brandName: string | null;
    categoryName: string | null;
    subcategoryName: string | null;
    productTypeName: string | null;
    image: string | null;
    similarity: number;
}

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    products?: ChatProduct[];
}

// ---------- Semantic Product Search ----------

export async function searchProductsByEmbedding(
    query: string,
    limit: number = 6
): Promise<ChatProduct[]> {
    try {
        // Generate 768-dim embedding for the user query
        const queryEmbedding = await getEmbedding768(query);

        if (!queryEmbedding || queryEmbedding.length !== 768) {
            console.error("Invalid embedding generated for query");
            return [];
        }

        // Format embedding as pgvector literal
        const embeddingStr = `[${queryEmbedding.join(",")}]`;

        // Cosine similarity search using pgvector
        const results = await db.execute(sql`
            SELECT
                p.id,
                p.title,
                p.slug,
                p.description,
                p.price,
                p.compare_at_price AS "compareAtPrice",
                p.media,
                b.name AS "brandName",
                c.name AS "categoryName",
                sc.name AS "subcategoryName",
                pt.name AS "productTypeName",
                1 - (p.semantic_search_embeddings <=> ${embeddingStr}::vector) AS similarity
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN sub_categories sc ON p.subcategory_id = sc.id
            LEFT JOIN product_types pt ON p.product_type_id = pt.id
            WHERE p.is_deleted = false
              AND p.is_published = true
              AND p.is_available = true
              AND p.semantic_search_embeddings IS NOT NULL
            ORDER BY p.semantic_search_embeddings <=> ${embeddingStr}::vector
            LIMIT ${limit}
        `);

        return (results as any[]).map((row) => {
            // Extract first image from media JSON
            let image: string | null = null;
            try {
                const media =
                    typeof row.media === "string"
                        ? JSON.parse(row.media)
                        : row.media;
                if (Array.isArray(media) && media.length > 0) {
                    image = media[0]?.url || media[0]?.mediaUrl || null;
                }
            } catch {
                image = null;
            }

            return {
                id: row.id,
                title: row.title,
                slug: row.slug,
                description: row.description,
                price: row.price,
                compareAtPrice: row.compareAtPrice,
                brandName: row.brandName,
                categoryName: row.categoryName,
                subcategoryName: row.subcategoryName,
                productTypeName: row.productTypeName,
                image,
                similarity: parseFloat(row.similarity) || 0,
            };
        });
    } catch (error) {
        console.error("Error in semantic product search:", error);
        return [];
    }
}

// ---------- Intent Detection ----------

function isProductQuery(message: string): boolean {
    const productKeywords = [
        "show",
        "find",
        "search",
        "recommend",
        "suggest",
        "looking for",
        "want",
        "need",
        "buy",
        "shop",
        "product",
        "products",
        "item",
        "items",
        "shirt",
        "dress",
        "pants",
        "jeans",
        "shoes",
        "sneakers",
        "sustainable",
        "eco",
        "organic",
        "cotton",
        "linen",
        "men",
        "women",
        "kids",
        "unisex",
        "price",
        "cheap",
        "affordable",
        "premium",
        "luxury",
        "brand",
        "category",
        "type",
        "style",
        "best",
        "top",
        "popular",
        "trending",
        "new",
        "clothing",
        "fashion",
        "wear",
        "outfit",
        "beauty",
        "skincare",
        "home",
        "living",
        "bag",
        "accessories",
        "jewelry",
        "under",
        "below",
        "above",
        "between",
        "similar",
        "like",
        "alternative",
    ];

    const lowerMessage = message.toLowerCase();
    const matchCount = productKeywords.filter((kw) =>
        lowerMessage.includes(kw)
    ).length;

    // If 2 or more product keywords found, treat as product query
    return matchCount >= 2;
}

// ---------- Context Building ----------

function buildSystemPrompt(products: ChatProduct[]): string {
    const basePrompt = `You are Sage, the friendly AI shopping assistant for Renivet — a sustainable marketplace that connects conscious consumers with eco-friendly, ethically sourced products.

Your personality:
- Warm, helpful, and knowledgeable about sustainable fashion and products
- Enthusiastic about eco-friendly choices without being preachy
- Concise but informative — keep responses under 150 words unless asked for detail
- Use emojis sparingly (1-2 per message max) for warmth

Guidelines:
- When recommending products, briefly explain why each is a good match
- Always mention the brand name and price when discussing products
- If the user asks about sustainability, be knowledgeable and specific
- For general questions about Renivet, explain it's a sustainable marketplace
- Never make up product information — only reference products provided in context
- If no products match well, be honest and suggest broadening the search
- Format prices by dividing by 100 (prices are stored in paisa/cents) and show as ₹
- Do NOT output product data as JSON — describe them naturally in conversation`;

    if (products.length > 0) {
        const productContext = products
            .map((p, i) => {
                const price = p.price
                    ? `₹${(p.price / 100).toFixed(0)}`
                    : "Price on request";
                const comparePrice = p.compareAtPrice
                    ? ` (was ₹${(p.compareAtPrice / 100).toFixed(0)})`
                    : "";
                return `Product ${i + 1}: "${p.title}" by ${p.brandName || "Unknown Brand"} | ${price}${comparePrice} | Category: ${p.categoryName || "N/A"} > ${p.subcategoryName || "N/A"} | Relevance: ${(p.similarity * 100).toFixed(0)}%`;
            })
            .join("\n");

        return `${basePrompt}

RETRIEVED PRODUCTS (use these to answer the user's query):
${productContext}

Mention the most relevant products naturally. If a product has a compare-at price higher than the current price, note it's on sale.`;
    }

    return basePrompt;
}

// ---------- LLM Response Generation ----------

export async function generateChatResponse(
    userMessage: string,
    conversationHistory: ChatMessage[]
): Promise<{ content: string; products: ChatProduct[] }> {
    const genAI = getGenAI();

    if (!genAI) {
        return {
            content:
                "I'm currently being set up. Please check back shortly! 🛠️",
            products: [],
        };
    }

    let products: ChatProduct[] = [];

    // Detect if this is a product-related query
    const needsProducts = isProductQuery(userMessage);

    if (needsProducts) {
        products = await searchProductsByEmbedding(userMessage, 6);
    }

    const systemPrompt = buildSystemPrompt(products);

    // Try multiple models as fallback chain
    const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];

    for (let i = 0; i < models.length; i++) {
        const modelName = models[i];
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemPrompt,
            });

            const history = conversationHistory.slice(-10).map((msg) => ({
                role:
                    msg.role === "user"
                        ? ("user" as const)
                        : ("model" as const),
                parts: [{ text: msg.content }],
            }));

            const chat = model.startChat({
                history,
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
            });

            const result = await chat.sendMessage(userMessage);
            const response = result.response;
            const text = response.text();

            return {
                content: text,
                products: needsProducts
                    ? products.filter((p) => p.similarity > 0.3)
                    : [],
            };
        } catch (error: unknown) {
            const errMsg =
                error instanceof Error ? error.message : String(error);
            console.warn(
                `Model ${modelName} failed: ${errMsg.slice(0, 100)}${i < models.length - 1 ? " → trying next..." : ""}`
            );
            if (i < models.length - 1) continue;
        }
    }

    return {
        content:
            "I'm a bit busy right now! Please try again in a few seconds 🙂",
        products: [],
    };
}
