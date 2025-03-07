"use client";

import { MediaBulkDeleteModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { convertBytesToHumanReadable } from "@/lib/utils";
import { BrandMediaItem } from "@/lib/validations";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useState } from "react";
import { MediaAction } from "./media-action";
import { MediaImage } from "./media-image";

export type TableMedia = BrandMediaItem;

const columns: ColumnDef<TableMedia>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            const data = row.original;
            return <MediaImage media={data} />;
        },
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
            const data = row.original;
            const fileType = data.name.split(".").pop();
            if (!fileType) return "unknown";

            return (
                <Badge className="whitespace-nowrap uppercase">
                    {fileType}
                </Badge>
            );
        },
    },
    {
        accessorKey: "size",
        header: "Size",
        cell: ({ row }) => {
            const data = row.original;
            return (
                <span className="whitespace-nowrap">
                    {convertBytesToHumanReadable(data.size)}
                </span>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Added On",
        cell: ({ row }) => {
            const data = row.original;
            return (
                <span className="whitespace-nowrap">
                    {format(new Date(data.createdAt), "MMM dd, yyyy")}
                </span>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const data = row.original;
            return <MediaAction data={data} />;
        },
    },
];

interface PageProps {
    brandId: string;
    initialData: {
        data: BrandMediaItem[];
        count: number;
    };
}

export function BrandMediaTable({ brandId, initialData }: PageProps) {
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const table = useReactTable({
        data: initialData.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-full md:w-auto">
                        <Input
                            placeholder="Search by name..."
                            value={
                                (table
                                    .getColumn("name")
                                    ?.getFilterValue() as string) ?? ""
                            }
                            onChange={(event) =>
                                table
                                    .getColumn("name")
                                    ?.setFilterValue(event.target.value)
                            }
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        {table.getFilteredSelectedRowModel().rows.length >
                            1 && (
                            <Button
                                size="sm"
                                className="h-8"
                                variant="destructive"
                                onClick={() => setIsBulkDeleteModalOpen(true)}
                            >
                                <Icons.Trash2 />
                                Bulk Delete
                            </Button>
                        )}
                        <DataTableViewOptions table={table} />
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext()
                                                      )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && "selected"
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
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between px-2">
                    <div className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s)
                        selected.
                    </div>

                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Rows per page</p>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue
                                        placeholder={
                                            table.getState().pagination.pageSize
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem
                                            key={pageSize}
                                            value={`${pageSize}`}
                                        >
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount()}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                className="hidden size-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">
                                    Go to first page
                                </span>
                                <Icons.ChevronsLeft />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8 p-0"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">
                                    Go to previous page
                                </span>
                                <Icons.ChevronLeft />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8 p-0"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <Icons.ChevronRight />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden size-8 p-0 lg:flex"
                                onClick={() =>
                                    table.setPageIndex(table.getPageCount() - 1)
                                }
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <Icons.ChevronsRight />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <MediaBulkDeleteModal
                mediaIds={table
                    .getFilteredSelectedRowModel()
                    .rows.map((row) => row.original.id)}
                brandId={brandId}
                isOpen={isBulkDeleteModalOpen}
                setIsOpen={setIsBulkDeleteModalOpen}
                onComplete={() => table.setRowSelection({})}
            />
        </>
    );
}
