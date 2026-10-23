"use client";

import { ColumnDef, flexRender, Table as TTable } from "@tanstack/react-table";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect } from "react";
import { Pagination } from "./data-table-dash";
import { getResultRange } from "./data-table-pagination-state";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select-dash";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./table";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 15;
const PAGE_SIZE_PREFERENCE_KEY = "admin-table-page-size";
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

const isValidPageSize = (value: number | null): value is PageSizeOption =>
    value !== null &&
    PAGE_SIZE_OPTIONS.includes(value as PageSizeOption) &&
    Number.isFinite(value);

export function DataTable<T>({
    table,
    columns,
    count,
    pages,
    showResults = true,
    tableContainerClassName,
    isLoading = false,
}: {
    table: TTable<T>;
    columns: ColumnDef<T>[];
    count: number;
    pages: number;
    showResults?: boolean;
    tableContainerClassName?: string;
    isLoading?: boolean;
}) {
    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(1)
    );
    const [limitRaw, setLimit] = useQueryState("limit", parseAsInteger);

    const activePageSize = isValidPageSize(limitRaw)
        ? limitRaw
        : DEFAULT_PAGE_SIZE;

    const rowCount = table.getRowModel().rows.length ?? 0;
    const resultRange = getResultRange({
        page,
        pageSize: activePageSize,
        rowCount,
        totalCount: count,
    });

    useEffect(() => {
        if (typeof window === "undefined") return;

        const saved = Number(
            window.localStorage.getItem(PAGE_SIZE_PREFERENCE_KEY)
        );
        const fallback = isValidPageSize(saved) ? saved : DEFAULT_PAGE_SIZE;

        if (limitRaw === null) {
            void setLimit(fallback);
            return;
        }

        if (isValidPageSize(limitRaw)) {
            window.localStorage.setItem(
                PAGE_SIZE_PREFERENCE_KEY,
                String(limitRaw)
            );
        }
    }, [limitRaw, setLimit]);

    const handlePageSizeChange = (value: string) => {
        const parsed = Number(value);
        if (!isValidPageSize(parsed)) return;

        void setLimit(parsed);
        void setPage(1);

        if (typeof window !== "undefined") {
            window.localStorage.setItem(
                PAGE_SIZE_PREFERENCE_KEY,
                String(parsed)
            );
        }
    };

    return (
        <>
            <div className="relative rounded-md border" aria-busy={isLoading}>
                {isLoading && (
                    <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-center bg-background/75 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
                        <span className="mr-2 size-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                        Updating products…
                    </div>
                )}
                <Table containerClassName={tableContainerClassName}>
                    <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, index) => (
                                <TableRow
                                    key={row.id}
                                    className={
                                        index % 2 === 0
                                            ? "bg-background"
                                            : "bg-muted/20"
                                    }
                                    data-state={
                                        row.getIsSelected()
                                            ? "selected"
                                            : undefined
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results found for the current filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
                    {showResults && (
                        <p>
                            Showing {resultRange.start}-{resultRange.end} of{" "}
                            {count ?? 0} results
                        </p>
                    )}

                    <div className="flex items-center gap-2">
                        <span>Rows per page</span>
                        <Select
                            value={String(limitRaw ?? DEFAULT_PAGE_SIZE)}
                            onValueChange={handlePageSizeChange}
                        >
                            <SelectTrigger className="h-8 w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Pagination total={pages} />
            </div>
        </>
    );
}
