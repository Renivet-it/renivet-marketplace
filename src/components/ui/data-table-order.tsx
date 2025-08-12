"use client";

import { ColumnDef, flexRender, Table as TTable } from "@tanstack/react-table";
import { Pagination } from "./data-table-dash";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select-dash";

interface DataTableProps<T> {
    table: TTable<T>;
    columns: ColumnDef<T>[];
    count: number;
    pages: number;
    perPage: number;
    onPerPageChange: (value: number) => void;
    enablePagination?: boolean;
    enablePerPage?: boolean;
    className?: string;
    headerClassName?: string;
    bodyClassName?: string;
    rowClassName?: string;
    cellClassName?: string;
    emptyState?: React.ReactNode;
}

export function DataTable<T>({
    table,
    columns,
    count,
    pages,
    perPage,
    onPerPageChange,
    enablePagination = true,
    enablePerPage = true,
    className = "",
    headerClassName = "",
    bodyClassName = "",
    rowClassName = "",
    cellClassName = "",
    emptyState,
}: DataTableProps<T>) {
    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            <div className="rounded-md border">
                <Table>
                    <TableHeader className={headerClassName}>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className={headerClassName}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody className={bodyClassName}>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={rowClassName}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={cellClassName}>
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
                                    {emptyState || "No results."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {(enablePagination || enablePerPage) && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {enablePerPage && (
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                                Rows per page
                            </p>
                            <Select
                                value={`${perPage}`}
                                onValueChange={(value) => onPerPageChange(Number(value))}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={perPage} />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 30, 40, 50, 100, 200, 500].map((size) => (
                                        <SelectItem key={size} value={`${size}`}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            Showing{" "}
                            {table.getState().pagination.pageIndex * perPage + 1}-
                            {Math.min(
                                (table.getState().pagination.pageIndex + 1) * perPage,
                                count
                            )}{" "}
                            of {count} results
                        </p>

                        {enablePagination && <Pagination total={pages} />}
                    </div>
                </div>
            )}
        </div>
    );
}