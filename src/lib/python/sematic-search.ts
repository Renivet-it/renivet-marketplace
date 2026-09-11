import axios from "axios";
import { requireEmbeddingServiceUrl } from "@/lib/python/service-url";
export const EMBEDDING_PROVIDER_TIMEOUT_MS = 15_000;

/**
 * Generate 384-dim embedding using MiniLM model (legacy)
 */
export async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await axios.post(
            requireEmbeddingServiceUrl("/embeddings/generate"),
            { text },
            {
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: EMBEDDING_PROVIDER_TIMEOUT_MS,
                maxRedirects: 0,
            }
        );

        const embedding = response.data.embedding;

        if (!Array.isArray(embedding) || embedding.length !== 384) {
            throw new Error("Invalid 384-dim embedding generated");
        }
        return embedding;
    } catch {
        throw new Error("Failed to generate embedding");
    }
}

/**
 * Generate 768-dim embedding using E5 model (advanced semantic search)
 * This is the preferred method for product search as it provides better
 * semantic understanding and relevance matching.
 */
export async function getEmbedding768(text: string): Promise<number[]> {
    try {
        const response = await axios.post(
            requireEmbeddingServiceUrl("/embeddings/generate-768"),
            { text },
            {
                headers: {
                    "Content-Type": "application/json",
                },
                timeout: EMBEDDING_PROVIDER_TIMEOUT_MS,
                maxRedirects: 0,
            }
        );

        const embedding = response.data.embedding;

        if (!Array.isArray(embedding) || embedding.length !== 768) {
            throw new Error("Invalid 768-dim embedding generated");
        }
        return embedding;
    } catch {
        throw new Error("Failed to generate 768-dim embedding");
    }
}

/**
 * Preprocess search query for better matching
 * - Normalizes case
 * - Removes extra whitespace
 * - Handles common product term variations
 */
export function preprocessSearchQuery(query: string): string {
    return (
        query
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " ")
            // Common normalization
            .replace(/t-?shirts?/gi, "t-shirt")
            .replace(/tshirts?/gi, "t-shirt")
            .replace(/jeans/gi, "jeans")
            .replace(/sneakers?/gi, "sneakers")
    );
}
