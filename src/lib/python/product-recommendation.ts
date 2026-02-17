import axios from "axios";

export async function getAdvancedRecommendations(productId: string) {
    // Prefer an env var so you can switch between local / production
    const baseUrl =
        process.env.EMBEDDING_SERVICE_URL || "http://localhost:8000";
    console.log("productId", productId);
    try {
        const response = await axios.get(
            // `${"http://64.227.137.174:8000"}/recommendations/similar-advanced`,
            `${"http://localhost:8000"}/recommendations/similar-advanced`,

            {
                params: { product_id: productId, top_n: 28 },
            }
        );

        // FastAPI returns an array of product objects
        return response.data; // -> [{ id, title, description, final_score, ... }]
    } catch (error: any) {
        console.error("Error fetching advanced recommendations:", error);
        const message =
            error.response?.data?.detail || "Failed to fetch recommendations";
        throw new Error(message);
    }
}
