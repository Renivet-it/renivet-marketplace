type BannerFileDeleter = (fileKey: string) => Promise<unknown>;
type CleanupFailureReporter = (fileKey: string, error: unknown) => void;

function reportCleanupFailure(fileKey: string) {
    console.error(
        "Banner image cleanup failed; manual cleanup may be required.",
        { fileKey }
    );
}

export async function persistBannerWithUploadCompensation<T>({
    fileKey,
    persist,
    deleteFile,
    onCleanupFailure = reportCleanupFailure,
}: {
    fileKey: string;
    persist: () => Promise<T>;
    deleteFile: BannerFileDeleter;
    onCleanupFailure?: CleanupFailureReporter;
}): Promise<T> {
    try {
        return await persist();
    } catch (persistenceError) {
        try {
            await deleteFile(fileKey);
        } catch (cleanupError) {
            onCleanupFailure(fileKey, cleanupError);
        }

        throw persistenceError;
    }
}

export async function cleanupBannerMediaAfterCommit({
    fileKey,
    deleteFile,
    onCleanupFailure = reportCleanupFailure,
}: {
    fileKey: string;
    deleteFile: BannerFileDeleter;
    onCleanupFailure?: CleanupFailureReporter;
}): Promise<void> {
    try {
        await deleteFile(fileKey);
    } catch (error) {
        onCleanupFailure(fileKey, error);
    }
}

export async function loadMobileBannersSafely<T>(
    load: () => Promise<T[]>,
    onFailure: (error: unknown) => void
): Promise<T[]> {
    try {
        return await load();
    } catch (error) {
        onFailure(error);
        return [];
    }
}
