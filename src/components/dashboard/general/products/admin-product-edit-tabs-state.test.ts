import { expect, test } from "bun:test";
import { getDefaultAdminProductTab } from "./admin-product-edit-tabs-state";

test("opens the Edit Product tab by default", () => {
    expect(getDefaultAdminProductTab(null, null)).toBe("edit");
    expect(getDefaultAdminProductTab("edit", null)).toBe("edit");
});

test("keeps explicit QC navigation and HSN focus behavior", () => {
    expect(getDefaultAdminProductTab("qc", null)).toBe("qc");
    expect(getDefaultAdminProductTab(null, "hsCode")).toBe("edit");
});
