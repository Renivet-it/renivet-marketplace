import { expect, test } from "bun:test";
import {
    compressBannerImage,
    MAX_BANNER_UPLOAD_BYTES,
} from "../src/lib/image-compression";

test("keeps banner images that already fit the upload limit unchanged", async () => {
    const file = new File([new Uint8Array(1024)], "banner.jpg", {
        type: "image/jpeg",
    });

    expect(await compressBannerImage(file)).toBe(file);
});

test("compresses oversized JPEG banners below the upload limit", async () => {
    const originalCreateImageBitmap = (globalThis as any).createImageBitmap;
    const originalDocument = Object.getOwnPropertyDescriptor(
        globalThis,
        "document"
    );
    const file = new File(
        [new Uint8Array(MAX_BANNER_UPLOAD_BYTES + 1)],
        "banner.jpg",
        {
            type: "image/jpeg",
        }
    );
    const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({
            clearRect: () => undefined,
            drawImage: () => undefined,
        }),
        toBlob: (callback: BlobCallback, type: string, quality = 1) => {
            const byteCount = Math.floor(5.5 * 1024 * 1024 * quality);
            callback(new Blob([new Uint8Array(byteCount)], { type }));
        },
    };

    (globalThis as any).createImageBitmap = async () => ({
        width: 2400,
        height: 1200,
        close: () => undefined,
    });
    Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: { createElement: () => canvas },
    });

    try {
        const compressed = await compressBannerImage(file);
        expect(compressed.size).toBeLessThanOrEqual(MAX_BANNER_UPLOAD_BYTES);
        expect(compressed.type).toBe("image/jpeg");
    } finally {
        (globalThis as any).createImageBitmap = originalCreateImageBitmap;
        if (originalDocument) {
            Object.defineProperty(globalThis, "document", originalDocument);
        } else {
            delete (globalThis as any).document;
        }
    }
});
