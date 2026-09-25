import { expect, test } from "bun:test";
import {
    getAdminMediaProxyUrl,
    getUploadThingFileKey,
} from "./admin-media-source";

test("builds a same-origin media proxy URL for a persisted media item", () => {
    expect(
        getAdminMediaProxyUrl("a25c5613-0282-4afc-ae65-bcb7d9bcfc95", {
            width: 480,
            quality: 70,
        })
    ).toBe("/api/admin/media/a25c5613-0282-4afc-ae65-bcb7d9bcfc95?w=480&q=70");
});

test("extracts UploadThing keys from current and legacy URLs", () => {
    expect(
        getUploadThingFileKey("https://4o4vm2cu6g.ufs.sh/f/current-key.webp")
    ).toBe("current-key.webp");
    expect(getUploadThingFileKey("https://utfs.io/f/legacy-key.jpg")).toBe(
        "legacy-key.jpg"
    );
    expect(getUploadThingFileKey("https://example.com/image.jpg")).toBeNull();
});
