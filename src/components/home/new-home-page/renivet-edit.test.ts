import { expect, test } from "bun:test";
import {
    RENIVET_EDIT_CARDS,
    RENIVET_EDIT_DESKTOP_LAYOUT,
} from "./renivet-edit";

test("Renivet Edit keeps the three approved editorial cards and responsive assets", () => {
    expect(RENIVET_EDIT_CARDS.map((card) => card.title)).toEqual([
        "Everyday Conscious",
        "Festive, Reimagined",
        "Home with Intention",
    ]);

    expect(RENIVET_EDIT_CARDS.map((card) => card.image)).toEqual([
        "/assets/renivet-edit/everyday-conscious.png",
        "/assets/renivet-edit/festive-reimagined.png",
        "/assets/renivet-edit/home-with-intention.png",
    ]);
    expect(RENIVET_EDIT_CARDS[2].mobileImage).toBe(
        "/assets/renivet-edit/home-with-intention-mobile.png"
    );
    expect(RENIVET_EDIT_CARDS.map((card) => card.href)).toEqual([
        "/shop",
        "/festive",
        "/shop/home-and-living",
    ]);
});

test("Renivet Edit fills the desktop viewport with fluid editorial imagery", () => {
    expect(RENIVET_EDIT_DESKTOP_LAYOUT).toEqual({
        fullWidth: true,
        imageAspectRatio: "4 / 3",
    });
});
