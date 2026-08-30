import { describe, expect, test } from "bun:test";
import { cartMetadata } from "../src/app/(protected)/mycart/metadata";

describe("REN-109 cart metadata", () => {
    test("uses Cart with the existing Renivet title template", () => {
        expect(cartMetadata.title).toEqual({
            default: "Cart",
            template: "%s | Renivet",
        });
    });
});
