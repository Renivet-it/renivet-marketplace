"use client";

import {
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    Pagination as ShadPagination,
} from "@/components/ui/pagination-dash";
import { parseAsInteger, useQueryState } from "nuqs";
import { Fragment, useMemo, useState } from "react";

interface PageProps {
    total: number;
}

const MAX_VISIBLE_NEIGHBORS = 1;

export function Pagination({ total }: PageProps) {
    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(1)
    );
    const [jumpValue, setJumpValue] = useState("");

    const safeTotal = Math.max(total, 1);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= safeTotal) {
            void setPage(newPage);
        }
    };

    const pagesToRender = useMemo(() => {
        const pages = new Set<number>([1, safeTotal]);

        for (
            let i = Math.max(1, page - MAX_VISIBLE_NEIGHBORS);
            i <= Math.min(safeTotal, page + MAX_VISIBLE_NEIGHBORS);
            i++
        ) {
            pages.add(i);
        }

        return Array.from(pages).sort((a, b) => a - b);
    }, [page, safeTotal]);

    const handleJump = () => {
        const target = Number(jumpValue);
        if (!Number.isFinite(target)) return;
        handlePageChange(Math.trunc(target));
        setJumpValue("");
    };

    return (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <ShadPagination className="mx-0 w-full sm:w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            size="sm"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page - 1);
                            }}
                            disabled={page === 1}
                        />
                    </PaginationItem>

                    {pagesToRender.map((current, index) => {
                        const previous = pagesToRender[index - 1];
                        const hasGap = previous && current - previous > 1;

                        return (
                            <Fragment key={current}>
                                {hasGap && (
                                    <PaginationItem className="hidden sm:inline-block">
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                )}

                                <PaginationItem className="hidden sm:inline-block">
                                    <PaginationLink
                                        size="sm"
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handlePageChange(current);
                                        }}
                                        isActive={page === current}
                                        disabled={safeTotal === 1}
                                    >
                                        {current}
                                    </PaginationLink>
                                </PaginationItem>
                            </Fragment>
                        );
                    })}

                    <PaginationItem>
                        <PaginationNext
                            size="sm"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page + 1);
                            }}
                            disabled={page === safeTotal}
                        />
                    </PaginationItem>
                </PaginationContent>
            </ShadPagination>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                    Page {Math.min(page, safeTotal)} of {safeTotal}
                </span>
                <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={safeTotal}
                    value={jumpValue}
                    onChange={(e) => setJumpValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleJump();
                    }}
                    placeholder="Go to"
                    className="h-8 w-16 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Jump to page"
                />
                <button
                    type="button"
                    onClick={handleJump}
                    className="h-8 rounded-md border border-input px-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                    Go
                </button>
            </div>
        </div>
    );
}
