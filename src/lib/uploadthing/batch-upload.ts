export const BRAND_MEDIA_UPLOAD_BATCH_SIZE = 20;
export const DEFAULT_UPLOAD_RETRY_ATTEMPTS = 3;

type BatchUploadOptions<TFile, TResult> = {
    batchSize?: number;
    retryAttempts?: number;
    onProgress?: (completed: number) => void;
    onBatchComplete?: (result: TResult[], batch: TFile[]) => Promise<void>;
};

const wait = (milliseconds: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function uploadFilesInBatches<TFile, TResult>(
    files: TFile[],
    uploadBatch: (batch: TFile[]) => Promise<TResult[]>,
    {
        batchSize = BRAND_MEDIA_UPLOAD_BATCH_SIZE,
        retryAttempts = DEFAULT_UPLOAD_RETRY_ATTEMPTS,
        onProgress,
        onBatchComplete,
    }: BatchUploadOptions<TFile, TResult> = {}
): Promise<TResult[]> {
    if (batchSize < 1 || retryAttempts < 1) {
        throw new Error("Upload batch limits must be positive");
    }

    const uploaded: TResult[] = [];

    for (let start = 0; start < files.length; start += batchSize) {
        const batch = files.slice(start, start + batchSize);
        let lastError: unknown;
        let result: TResult[] | undefined;

        for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
            try {
                result = await uploadBatch(batch);
                if (result.length !== batch.length) {
                    throw new Error("Upload batch returned an incomplete result");
                }
                lastError = undefined;
                break;
            } catch (error) {
                lastError = error;
                if (attempt < retryAttempts) await wait(attempt * 500);
            }
        }

        if (lastError) throw lastError;
        if (!result) throw new Error("Upload batch did not return a result");
        await onBatchComplete?.(result, batch);
        uploaded.push(...result);
        onProgress?.(Math.min(start + batch.length, files.length));
    }

    return uploaded;
}
