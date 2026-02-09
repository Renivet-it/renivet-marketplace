import axios from "axios";

const EMBEDDING_SERVICE_URL =
    process.env.EMBEDDING_SERVICE_URL || "http://localhost:8000";
            // `${"http://64.227.137.174:8000"}/suggestions/ai-suggestions`,

/**
 * Generate 384-dim embedding using MiniLM model (legacy)
 */
export async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await axios.post(
            `${"http://64.227.137.174:8000"}/embeddings/generate`,
            { text },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const embedding = response.data.embedding;

        if (!Array.isArray(embedding) || embedding.length !== 384) {
            throw new Error("Invalid 384-dim embedding generated");
        }
        return embedding;
    } catch (error: any) {
        console.error("Error generating 384-dim embedding:", error);
        const errorMessage =
            error.response?.data?.detail || "Failed to generate embedding";
        throw new Error(errorMessage);
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
            `${"http://64.227.137.174:8000"}/embeddings/generate-768`,
            // `${"http://64.227.137.174:8000"}/embeddings/generate-768`,
            { text },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const embedding = response.data.embedding;

        if (!Array.isArray(embedding) || embedding.length !== 768) {
            throw new Error("Invalid 768-dim embedding generated");
        }
        return embedding;
    } catch (error: any) {
        console.error("Error generating 768-dim embedding:", error);
        const errorMessage =
            error.response?.data?.detail ||
            "Failed to generate 768-dim embedding";
        throw new Error(errorMessage);
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
