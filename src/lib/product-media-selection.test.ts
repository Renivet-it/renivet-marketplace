import { describe, expect, test } from "bun:test";
import {
    getVisibleMedia,
    moveSelectedMedia,
    removeSelectedMedia,
    uniqueSelectedMedia,
} from "./product-media-selection";

const media = (id: string) => ({ id }) as never;

describe("product media selection", () => {
    test("removes only the requested media item", () => {
        expect(
            removeSelectedMedia([media("a"), media("b"), media("c")], "b")
        ).toEqual([media("a"), media("c")]);
    });

    test("moves selected media within the list and clamps boundaries", () => {
        const selected = [media("a"), media("b"), media("c")];

        expect(moveSelectedMedia(selected, 2, -1)).toEqual([
            media("a"),
            media("c"),
            media("b"),
        ]);
        expect(moveSelectedMedia(selected, 0, -1)).toEqual(selected);
        expect(moveSelectedMedia(selected, 2, 1)).toEqual(selected);
    });

    test("deduplicates media without changing first-seen order", () => {
        expect(
            uniqueSelectedMedia([media("b"), media("a"), media("b")])
        ).toEqual([media("b"), media("a")]);
    });

    test("limits the initial media preview to a small render window", () => {
        const items = Array.from({ length: 100 }, (_, index) =>
            media(String(index))
        );

        expect(getVisibleMedia(items, 24)).toHaveLength(24);
        expect(getVisibleMedia(items, 24)).toEqual(items.slice(0, 24));
    });
});
