import { describe, expect, test } from "bun:test";
import {
    getAdminMediaTransform,
    resolveAdminMediaSourceUrl,
} from "./admin-media-transform";

describe("admin media transform", () => {
    test("uses bounded thumbnail dimensions and quality", () => {
        expect(
            getAdminMediaTransform(
                new URL("https://renivet.com/api/admin/media/id?w=9999&q=1")
            )
        ).toEqual({ width: 800, quality: 40 });
        expect(
            getAdminMediaTransform(
                new URL("https://renivet.com/api/admin/media/id")
            )
        ).toEqual({ width: 480, quality: 70 });
    });

    test("signs private UploadThing files before fetching", async () => {
        const signedKeys: string[] = [];
        const source = await resolveAdminMediaSourceUrl(
            "https://4o4vm2cu6g.ufs.sh/f/private-image.webp",
            async (key) => {
                signedKeys.push(key);
                return `https://signed.example/${key}`;
            }
        );

        expect(signedKeys).toEqual(["private-image.webp"]);
        expect(source).toBe("https://signed.example/private-image.webp");
    });

    test("keeps non-UploadThing sources unchanged", async () => {
        const source = await resolveAdminMediaSourceUrl(
            "https://cdn.example.com/image.jpg",
            async () => "unused"
        );

        expect(source).toBe("https://cdn.example.com/image.jpg");
    });
});
