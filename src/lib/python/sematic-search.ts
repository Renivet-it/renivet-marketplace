import axios from "axios";

export async function getEmbedding(text:any) {
  try {
    const embeddingServiceUrl = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8000";
    console.log("Generating embedding for text:", embeddingServiceUrl);
    const response = await axios.post(`${"http://localhost:8000"}/embeddings/generate`, { text }, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const embedding = response.data.embedding;

    if (!Array.isArray(embedding) || embedding.length !== 384) {
      throw new Error("Invalid embedding generated");
    }
    return embedding;
  } catch (error:any) {
    console.error("Error generating embedding:", error);
    // If the error comes from the server, include the server"s error message
    const errorMessage = error.response?.data?.detail || "Failed to generate embedding";
    console.log("Error message:", error);
    throw new Error(errorMessage);
  }
}