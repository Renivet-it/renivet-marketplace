"use server";

import axios from "axios";

export async function fetchSuggestions(query: string): Promise<string[]> {
    try {
        console.log(
            "Fetching suggestions for query:",
            process.env.EMBEDDING_SERVICE_URL
        );
        const embeddingServiceUrl = process.env.EMBEDDING_SERVICE_URL;
        const response = await axios.get(
            `${"http://localhost:8000"}/suggestions/ai-suggestions`,
            {
                params: { query }, // Pass the query as a URL parameter
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const suggestions = response.data;
        console.log("Received suggestions:", suggestions);

        // Validate that the response is an array of strings
        if (
            !Array.isArray(suggestions) ||
            !suggestions.every((item) => typeof item === "string")
        ) {
            throw new Error("Invalid suggestions format received");
        }

        return suggestions;
    } catch (error: any) {
        console.error("Error fetching suggestions:", error);
        const errorMessage =
            error.response?.data?.detail || "Failed to fetch suggestions";
        throw new Error(errorMessage);
    }
}
