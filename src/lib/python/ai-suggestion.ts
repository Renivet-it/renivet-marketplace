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
            `${"http://64.227.137.174:8000"}/suggestions/ai-suggestions`,
            // `${"http://localhost:8000"}/suggestions/ai-suggestions`,
            {
                params: { query }, // Pass the query as a URL parameter
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const suggestionsData = response.data;
        console.log("Received suggestions:", suggestionsData);

        // Validate that the response is an array
        if (!Array.isArray(suggestionsData)) {
            throw new Error("Invalid suggestions format received");
        }

        // Map to string array if it's an array of objects with 'text' property
        const suggestions: string[] = suggestionsData
            .map((item: any) => {
                if (typeof item === "string") return item;
                if (
                    typeof item === "object" &&
                    item !== null &&
                    "text" in item
                ) {
                    return item.text;
                }
                return "";
            })
            .filter((item) => item !== "");

        return suggestions;
    } catch (error: any) {
        console.error("Error fetching suggestions:", error);
        const errorMessage =
            error.response?.data?.detail || "Failed to fetch suggestions";
        throw new Error(errorMessage);
    }
}
