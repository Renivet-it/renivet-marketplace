import { expect, test } from "bun:test";
import { getAdminMediaProxyUrl } from "./admin-media-source";

test("builds a same-origin media proxy URL for a persisted media item", () => {
    expect(getAdminMediaProxyUrl("a25c5613-0282-4afc-ae65-bcb7d9bcfc95")).toBe(
        "/api/admin/media/a25c5613-0282-4afc-ae65-bcb7d9bcfc95"
    );
});
