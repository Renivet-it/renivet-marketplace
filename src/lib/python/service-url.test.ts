import { afterEach, describe, expect, test } from "bun:test";
import { buildEmbeddingServiceUrl } from "./service-url";

const originalEnv = {
    appEnv: process.env.APP_ENV,
    embeddingServiceUrl: process.env.EMBEDDING_SERVICE_URL,
    nodeEnv: process.env.NODE_ENV,
};

afterEach(() => {
    if (originalEnv.appEnv === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = originalEnv.appEnv;
    if (originalEnv.embeddingServiceUrl === undefined)
        delete process.env.EMBEDDING_SERVICE_URL;
    else process.env.EMBEDDING_SERVICE_URL = originalEnv.embeddingServiceUrl;
    if (originalEnv.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnv.nodeEnv;
});

describe("buildEmbeddingServiceUrl", () => {
    test("allows a remote HTTP service during local development", () => {
        process.env.NODE_ENV = "development";
        process.env.APP_ENV = "development";
        process.env.EMBEDDING_SERVICE_URL = "http://embedding.internal:8000";

        expect(buildEmbeddingServiceUrl("/embeddings/generate")?.toString()).toBe(
            "http://embedding.internal:8000/embeddings/generate"
        );
    });

    test("still rejects a remote HTTP service in production", () => {
        process.env.NODE_ENV = "production";
        process.env.APP_ENV = "production";
        process.env.EMBEDDING_SERVICE_URL = "http://embedding.internal:8000";

        expect(buildEmbeddingServiceUrl("/embeddings/generate")).toBeNull();
    });
});
