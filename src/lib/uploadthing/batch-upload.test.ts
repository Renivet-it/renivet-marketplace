import { describe, expect, test } from "bun:test";
import { uploadFilesInBatches } from "./batch-upload";

describe("uploadFilesInBatches", () => {
    test("uploads all files in provider-safe batches and reports progress", async () => {
        const files = Array.from({ length: 41 }, (_, index) => index);
        const batches: number[][] = [];
        const progress: number[] = [];

        const result = await uploadFilesInBatches(
            files,
            async (batch) => {
                batches.push(batch);
                return batch.map((file) => `uploaded-${file}`);
            },
            { batchSize: 20, onProgress: (completed) => progress.push(completed) }
        );

        expect(batches.map((batch) => batch.length)).toEqual([20, 20, 1]);
        expect(result).toHaveLength(41);
        expect(progress).toEqual([20, 40, 41]);
    });

    test("retries a failed batch and continues only after it succeeds", async () => {
        let attempts = 0;
        const result = await uploadFilesInBatches(
            ["a", "b"],
            async (batch) => {
                attempts += 1;
                if (attempts === 1) throw new Error("temporary failure");
                return batch;
            },
            { batchSize: 2, retryAttempts: 2 }
        );

        expect(attempts).toBe(2);
        expect(result).toEqual(["a", "b"]);
    });
});
