import { describe, expect, test } from "bun:test";
import { runConcurrentSearchTasks } from "./search-concurrency";

describe("runConcurrentSearchTasks", () => {
    test("starts the RAG task before the slower embedding task resolves", async () => {
        let resolveEmbedding!: (value: string) => void;
        const embedding = new Promise<string>((resolve) => {
            resolveEmbedding = resolve;
        });
        const started: string[] = [];

        const result = runConcurrentSearchTasks(
            async () => {
                started.push("embedding");
                return embedding;
            },
            async () => {
                started.push("rag");
                return "rag-result";
            }
        );

        await Promise.resolve();
        expect(started).toEqual(["embedding", "rag"]);

        resolveEmbedding("embedding-result");
        await expect(result).resolves.toEqual([
            "embedding-result",
            "rag-result",
        ]);
    });
});
