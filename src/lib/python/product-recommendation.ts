import axios from "axios";
import { buildEmbeddingServiceUrl } from "@/lib/python/service-url";

export async function getAdvancedRecommendations(productId: string) {
    try {
        const url = buildEmbeddingServiceUrl(
            "/recommendations/similar-advanced"
        );
        if (!url) throw new Error("Embedding service is not configured");
        const response = await axios.get(
            url.toString(),
            {
                params: { product_id: productId, top_n: 28 },
                timeout: 5000,
                maxRedirects: 0,
            }
        );

        // FastAPI returns an array of product objects
        return response.data; // -> [{ id, title, description, final_score, ... }]
    } catch {
        throw new Error("Failed to fetch recommendations");
    }
}
