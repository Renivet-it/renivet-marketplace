"use client";

import { Button } from "@/components/ui/button-dash";
import { getPaginationState } from "@/components/ui/data-table-pagination-state";
import {
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    Pagination as ShadPagination,
} from "@/components/ui/pagination-dash";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

    const pagination = getPaginationState({ page, totalPages: total });

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            void setPage(newPage);
        }
    };

    const pagesToRender = useMemo(() => {
        const pages = new Set<number>([1, pagination.totalPages]);

        for (
            let i = Math.max(1, pagination.page - MAX_VISIBLE_NEIGHBORS);
            i <=
            Math.min(
                pagination.totalPages,
                pagination.page + MAX_VISIBLE_NEIGHBORS
            );
            i++
        ) {
            pages.add(i);
        }

        return Array.from(pages).sort((a, b) => a - b);
    }, [pagination.page, pagination.totalPages]);

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
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                handlePageChange(pagination.previousPage)
                            }
                            disabled={!pagination.canGoPrevious}
                            aria-label="Go to previous page"
                        >
                            <ChevronLeft className="size-4" />
                            Previous
                        </Button>
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
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            pagination.page === current
                                                ? "outline"
                                                : "ghost"
                                        }
                                        onClick={() =>
                                            handlePageChange(current)
                                        }
                                        aria-current={
                                            pagination.page === current
                                                ? "page"
                                                : undefined
                                        }
                                        disabled={pagination.totalPages === 1}
                                    >
                                        {current}
                                    </Button>
                                </PaginationItem>
                            </Fragment>
                        );
                    })}

                    <PaginationItem>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                                handlePageChange(pagination.nextPage)
                            }
                            disabled={!pagination.canGoNext}
                            aria-label="Go to next page"
                        >
                            Next
                            <ChevronRight className="size-4" />
                        </Button>
                    </PaginationItem>
                </PaginationContent>
            </ShadPagination>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                    Page {pagination.page} of {pagination.totalPages}
                </span>
                <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={pagination.totalPages}
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
