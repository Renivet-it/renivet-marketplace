export const PRODUCT_IMPORT_MAX_PRODUCTS_PER_BATCH = 10;
export const PRODUCT_IMPORT_MAX_BYTES_PER_BATCH = 3_000_000;

export class ProductImportBatchingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProductImportBatchingError";
    }
}

type BatchOptions = {
    maxProducts?: number;
    maxBytes?: number;
};

function serializedSizeInBytes(value: unknown) {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export function createProductImportBatches<T>(
    products: T[],
    {
        maxProducts = PRODUCT_IMPORT_MAX_PRODUCTS_PER_BATCH,
        maxBytes = PRODUCT_IMPORT_MAX_BYTES_PER_BATCH,
    }: BatchOptions = {}
): T[][] {
    if (maxProducts < 1 || maxBytes < 1) {
        throw new ProductImportBatchingError("Import batch limits must be positive");
    }

    const batches: T[][] = [];
    let currentBatch: T[] = [];

    for (const product of products) {
        if (serializedSizeInBytes([product]) > maxBytes) {
            throw new ProductImportBatchingError(
                "A single product is too large to import in one request"
            );
        }

        const candidateBatch = [...currentBatch, product];
        const exceedsProductLimit = candidateBatch.length > maxProducts;
        const exceedsByteLimit = serializedSizeInBytes(candidateBatch) > maxBytes;

        if (currentBatch.length > 0 && (exceedsProductLimit || exceedsByteLimit)) {
            batches.push(currentBatch);
            currentBatch = [product];
        } else {
            currentBatch = candidateBatch;
        }
    }

    if (currentBatch.length > 0) batches.push(currentBatch);

    return batches;
}
