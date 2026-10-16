import { readFileSync } from "node:fs";
import { expect, test } from "bun:test";
import {
    CURATION_DESKTOP_DIMENSIONS,
    CURATION_IMAGE,
    CURATION_IMAGE_DESKTOP_DIMENSIONS,
    CURATION_STEPS,
} from "./how-renivet-curates";

test("How Renivet curates keeps the approved editorial content and image", () => {
    expect(CURATION_STEPS.map((step) => step.title)).toEqual([
        "We know the brands",
        "We look closer",
        "We choose better together",
    ]);
    expect(CURATION_IMAGE).toBe(
        "/assets/how-renivet-curates/artisanal-incense.png"
    );
});

test("How Renivet curates uses the approved desktop dimensions", () => {
    expect(CURATION_DESKTOP_DIMENSIONS).toEqual({
        width: 1184,
        height: 591,
    });
    expect(CURATION_IMAGE_DESKTOP_DIMENSIONS).toEqual({
        width: 507,
        height: 350,
    });
});

test("How Renivet curates appears directly after The Renivet Edit", () => {
    const page = readFileSync("src/app/(home)/page.tsx", "utf8");
    const editPosition = page.indexOf("<RenivetEdit />");
    const curationPosition = page.indexOf("<HowRenivetCurates />");

    expect(editPosition).toBeGreaterThan(-1);
    expect(curationPosition).toBeGreaterThan(editPosition);
    expect(page).not.toContain("<ProductsUnder999Fetch />");
});
