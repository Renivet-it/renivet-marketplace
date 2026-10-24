import { describe, expect, test } from "bun:test";
import {
    getPaginationState,
    getResultRange,
    getTotalPages,
} from "./data-table-pagination-state";

describe("getPaginationState", () => {
    test("clamps an invalid page and keeps next and previous inside bounds", () => {
        expect(getPaginationState({ page: 9, totalPages: 3 })).toEqual({
            page: 3,
            totalPages: 3,
            previousPage: 2,
            nextPage: 3,
            canGoPrevious: true,
            canGoNext: false,
        });
    });

    test("uses one stable page for an empty result set", () => {
        expect(getPaginationState({ page: 0, totalPages: 0 })).toEqual({
            page: 1,
            totalPages: 1,
            previousPage: 1,
            nextPage: 1,
            canGoPrevious: false,
            canGoNext: false,
        });
    });
});

describe("getResultRange", () => {
    test("reports the exact last-page result range", () => {
        expect(
            getResultRange({
                page: 3,
                pageSize: 10,
                rowCount: 3,
                totalCount: 23,
            })
        ).toEqual({ start: 21, end: 23 });
    });

    test("reports a zero range when there are no results", () => {
        expect(
            getResultRange({
                page: 1,
                pageSize: 15,
                rowCount: 0,
                totalCount: 0,
            })
        ).toEqual({ start: 0, end: 0 });
    });
});

test("getTotalPages always returns a usable positive page count", () => {
    expect(getTotalPages(0, 15)).toBe(1);
    expect(getTotalPages(31, 15)).toBe(3);
});
