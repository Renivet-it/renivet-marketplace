"use client";

import {
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    Pagination as ShadPagination,
} from "@/components/ui/pagination-general";
import { parseAsInteger, useQueryState } from "nuqs";

interface PageProps {
    total: number;
}

export function Pagination({ total }: PageProps) {
    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(1)
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= total) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 3;

        if (total <= maxVisiblePages) {
            for (let i = 1; i <= total; i++) {
                pages.push(
                    <PaginationItem key={i} className="hidden sm:inline-block">
                        <PaginationLink
                            size="sm"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(i);
                            }}
                            isActive={page === i}
                            disabled={total === 1}
                        >
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            pages.push(
                <PaginationItem key={1} className="hidden sm:inline-block">
                    <PaginationLink
                        size="sm"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(1);
                        }}
                        isActive={page === 1}
                        disabled={total === 1}
                    >
                        1
                    </PaginationLink>
                </PaginationItem>
            );

            if (page > 2) {
                pages.push(
                    <PaginationItem
                        key="ellipsis-start"
                        className="hidden sm:inline-block"
                    >
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }

            if (page !== 1 && page !== total) {
                pages.push(
                    <PaginationItem
                        key={page}
                        className="hidden sm:inline-block"
                    >
                        <PaginationLink
                            size="sm"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page);
                            }}
                            isActive
                            disabled
                        >
                            {page}
                        </PaginationLink>
                    </PaginationItem>
                );
            }

            if (page < total - 1) {
                pages.push(
                    <PaginationItem
                        key="ellipsis-end"
                        className="hidden sm:inline-block"
                    >
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }

            pages.push(
                <PaginationItem key={total} className="hidden sm:inline-block">
                    <PaginationLink
                        size="sm"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(total);
                        }}
                        isActive={page === total}
                        disabled={total === 1}
                    >
                        {total}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return pages;
    };

    return (
        <div>
            <ShadPagination>
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
                    {renderPageNumbers()}
                    <PaginationItem>
                        <PaginationNext
                            size="sm"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page + 1);
                            }}
                            disabled={page === total}
                        />
                    </PaginationItem>
                </PaginationContent>
            </ShadPagination>
        </div>
    );
}
