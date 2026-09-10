import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import {
    getEmbedding,
    getEmbedding768,
} from "@/lib/python/sematic-search";
import { and, asc, eq, isNull, or, sql } from "drizzle-orm";

export const EMBEDDING_SYNC_BATCH_SIZE = 25;
export const EMBEDDING_SYNC_MAX_RUNTIME_MS = 10 * 60 * 1000;
export const EMBEDDING_SYNC_RETRY_ATTEMPTS = 3;

type EmbeddingVector = number[] | null;

export type EmbeddingSyncProduct = {
    id: string;
    title: string;
    description: string | null;
    metaKeywords: string[] | null;
    brand?: { name: string } | null;
    category?: { name: string } | null;
    subcategory?: { name: string } | null;
    productType?: { name: string } | null;
    isActive: boolean;
    isPublished: boolean;
    isDeleted: boolean;
    searchSuggestionEmbeddings: EmbeddingVector;
    semanticSearchEmbeddings: EmbeddingVector;
};

export type EmbeddingSyncPlan = EmbeddingSyncProduct & {
    suggestionText: string;
    semanticText: string;
    needsSuggestion: boolean;
    needsSemantic: boolean;
};

export type EmbeddingSyncResult = {
    processed: number;
    updated: number;
    skipped: number;
    failed: number;
    partiallyUpdated: number;
    alreadyRunning: boolean;
};

export function isEligibleForEmbeddingSync(
    product: Pick<
        EmbeddingSyncProduct,
        | "isActive"
        | "isPublished"
        | "isDeleted"
        | "searchSuggestionEmbeddings"
        | "semanticSearchEmbeddings"
    >
) {
    return (
        product.isActive &&
        product.isPublished &&
        !product.isDeleted &&
        (product.searchSuggestionEmbeddings === null ||
            product.semanticSearchEmbeddings === null)
    );
}

function joinParts(parts: Array<string | null | undefined>) {
    return parts
        .flatMap((part) => (part?.trim() ? [part.trim()] : []))
        .join(" ");
}

export function buildEmbeddingSyncPlan(productsToProcess: EmbeddingSyncProduct[]) {
    return productsToProcess
        .filter(isEligibleForEmbeddingSync)
        .sort((left, right) => left.id.localeCompare(right.id))
        .slice(0, EMBEDDING_SYNC_BATCH_SIZE)
        .map((product) => ({
            ...product,
            suggestionText: joinParts([
                product.metaKeywords?.join(", "),
                product.category?.name,
                product.subcategory?.name,
                product.productType?.name,
                product.brand?.name,
            ]),
            semanticText: joinParts([
                product.title,
                product.description,
                product.metaKeywords?.join(", "),
                product.category?.name,
                product.subcategory?.name,
                product.productType?.name,
                product.brand?.name,
            ]),
            needsSuggestion: product.searchSuggestionEmbeddings === null,
            needsSemantic: product.semanticSearchEmbeddings === null,
        }));
}

export function getEmbeddingSyncResult(result: EmbeddingSyncResult) {
    return {
        processed: result.processed,
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
        partiallyUpdated: result.partiallyUpdated,
        alreadyRunning: result.alreadyRunning,
    };
}

async function wait(delayMs: number) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function withRetries<T>(task: () => Promise<T>) {
    let lastError: unknown;
    for (let attempt = 1; attempt <= EMBEDDING_SYNC_RETRY_ATTEMPTS; attempt++) {
        try {
            return await task();
        } catch (error) {
            lastError = error;
            if (attempt < EMBEDDING_SYNC_RETRY_ATTEMPTS) {
                await wait(attempt * 250);
            }
        }
    }
    throw lastError;
}

export async function syncProductEmbeddings(
    now = Date.now()
): Promise<EmbeddingSyncResult> {
    return db.transaction(async (tx) => {
        const lockRows = await tx.execute<{ locked: boolean }>(sql`
            select pg_try_advisory_xact_lock(hashtext('renivet:search-embedding-sync')) as locked
        `);
        if (!lockRows[0]?.locked) {
            return getEmbeddingSyncResult({
                processed: 0,
                updated: 0,
                skipped: 0,
                failed: 0,
                partiallyUpdated: 0,
                alreadyRunning: true,
            });
        }

        const rows = await tx.query.products.findMany({
            where: and(
                eq(products.isActive, true),
                eq(products.isPublished, true),
                eq(products.isDeleted, false),
                or(
                    isNull(products.searchSuggestionEmbeddings),
                    isNull(products.semanticSearchEmbeddings)
                )
            ),
            orderBy: [asc(products.id)],
            limit: EMBEDDING_SYNC_BATCH_SIZE,
            with: {
                brand: true,
                category: true,
                subcategory: true,
                productType: true,
            },
        });
        const plan = buildEmbeddingSyncPlan(rows as EmbeddingSyncProduct[]);
        const result = {
            processed: 0,
            updated: 0,
            skipped: 0,
            failed: 0,
            partiallyUpdated: 0,
            alreadyRunning: false,
        };

        for (const product of plan) {
            if (Date.now() - now >= EMBEDDING_SYNC_MAX_RUNTIME_MS) break;
            result.processed += 1;

            let suggestionEmbedding: number[] | undefined;
            let semanticEmbedding: number[] | undefined;
            let suggestionFailed = false;
            let semanticFailed = false;

            if (product.needsSuggestion && product.suggestionText) {
                try {
                    suggestionEmbedding = await withRetries(() =>
                        getEmbedding(product.suggestionText)
                    );
                } catch {
                    suggestionFailed = true;
                }
            }

            if (product.needsSemantic && product.semanticText) {
                try {
                    semanticEmbedding = await withRetries(() =>
                        getEmbedding768(product.semanticText)
                    );
                } catch {
                    semanticFailed = true;
                }
            }

            const updates: {
                searchSuggestionEmbeddings?: number[];
                semanticSearchEmbeddings?: number[];
            } = {};
            if (suggestionEmbedding) updates.searchSuggestionEmbeddings = suggestionEmbedding;
            if (semanticEmbedding) updates.semanticSearchEmbeddings = semanticEmbedding;

            if (!Object.keys(updates).length) {
                result.failed += 1;
                continue;
            }

            const updateConditions = [
                eq(products.id, product.id),
                eq(products.isActive, true),
                eq(products.isPublished, true),
                eq(products.isDeleted, false),
            ];
            if (suggestionEmbedding) {
                updateConditions.push(isNull(products.searchSuggestionEmbeddings));
            }
            if (semanticEmbedding) {
                updateConditions.push(isNull(products.semanticSearchEmbeddings));
            }

            const updatedRows = await tx
                .update(products)
                .set(updates)
                .where(and(...updateConditions))
                .returning({ id: products.id });

            if (!updatedRows.length) {
                result.skipped += 1;
                continue;
            }

            result.updated += 1;
            if (suggestionFailed || semanticFailed) result.partiallyUpdated += 1;
        }

        return getEmbeddingSyncResult(result);
    });
}
