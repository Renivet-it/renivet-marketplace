import { expect, test } from "bun:test";
import {
    canExportOperationalReport,
    canExportTdsReport,
} from "./export-access";

test("permits TDS export when the user has finance module view access", () => {
    expect(canExportTdsReport({ canView: true, canManage: false })).toBe(true);
});

test("denies TDS export without finance module access", () => {
    expect(canExportTdsReport({ canView: false, canManage: false })).toBe(
        false
    );
});

test("permits operational export only for a finance administrator", () => {
    expect(canExportOperationalReport(true)).toBe(true);
    expect(canExportOperationalReport(false)).toBe(false);
});
