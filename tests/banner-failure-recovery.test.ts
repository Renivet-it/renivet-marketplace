import { readFile } from "node:fs/promises";
import { expect, test } from "bun:test";

test("banner mutations compensate failed inserts and defer media cleanup until commit", async () => {
    const router = await readFile(
        "src/lib/trpc/routes/general/content.ts",
        "utf8"
    );
    const createStart = router.indexOf("createBanner: protectedProcedure");
    const updateStart = router.indexOf("updateBanner: protectedProcedure");
    const deleteStart = router.indexOf("deleteBanner: protectedProcedure");
    const create = router.slice(createStart, updateStart);
    const update = router.slice(updateStart, deleteStart);
    const remove = router.slice(
        deleteStart,
        router.indexOf("export const marketingStripRouter")
    );

    expect(create).toContain("persistBannerWithUploadCompensation");
    expect(update).toContain("persistBannerWithUploadCompensation");
    expect(update).toContain("cleanupBannerMediaAfterCommit");
    expect(remove).toContain("cleanupBannerMediaAfterCommit");
});

test("mobile banner query failure is isolated from desktop banners", async () => {
    const page = await readFile("src/app/(home)/page.tsx", "utf8");
    const landing = await readFile("src/components/home/landing.tsx", "utf8");

    expect(page).toContain("loadMobileBannersSafely");
    expect(page).toContain("mobileBanners");
    expect(landing).toContain("mobileBanners.length");
});

test("failed banner persistence compensates by deleting the new upload and preserves the DB error", async () => {
    const source = await readFile("src/lib/banner-recovery.ts", "utf8").catch(
        () => ""
    );
    expect(source).toContain("persistBannerWithUploadCompensation");

    const { persistBannerWithUploadCompensation } = await import(
        "../src/lib/banner-recovery"
    );
    const persistenceError = new Error("database write failed");
    const deleted: string[] = [];
    const resultError = await persistBannerWithUploadCompensation({
        fileKey: "new-file-key",
        persist: async () => {
            throw persistenceError;
        },
        deleteFile: async (fileKey) => {
            deleted.push(fileKey);
        },
    }).catch((error: unknown) => error);

    expect(resultError).toBe(persistenceError);
    expect(deleted).toEqual(["new-file-key"]);
});

test("media-cleanup failure is logged without replacing the committed result", async () => {
    const source = await readFile("src/lib/banner-recovery.ts", "utf8").catch(
        () => ""
    );
    expect(source).toContain("cleanupBannerMediaAfterCommit");

    const { cleanupBannerMediaAfterCommit } = await import(
        "../src/lib/banner-recovery"
    );
    const failures: Array<{ fileKey: string; error: unknown }> = [];
    await cleanupBannerMediaAfterCommit({
        fileKey: "old-file-key",
        deleteFile: async () => {
            throw new Error("provider unavailable");
        },
        onCleanupFailure: (fileKey, error) => failures.push({ fileKey, error }),
    });

    expect(failures).toHaveLength(1);
    expect(failures[0]?.fileKey).toBe("old-file-key");
});

test("mobile banner read failure returns no slides and reports the error", async () => {
    const source = await readFile("src/lib/banner-recovery.ts", "utf8").catch(
        () => ""
    );
    expect(source).toContain("loadMobileBannersSafely");

    const { loadMobileBannersSafely } = await import(
        "../src/lib/banner-recovery"
    );
    const error = new Error("database unavailable");
    const reported: unknown[] = [];
    const banners = await loadMobileBannersSafely(
        async () => {
            throw error;
        },
        (failure) => reported.push(failure)
    );

    expect(banners).toEqual([]);
    expect(reported).toEqual([error]);
});
