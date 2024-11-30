"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { Tag } from "@/lib/validations";
import {
    ColumnDef,
    ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { TagAction } from "./tag-action";

export type TableTag = Tag & {
    blogs: number;
};

const columns: ColumnDef<TableTag>[] = [
    {
        accessorKey: "name",
        header: "Name",
        enableHiding: false,
    },
    {
        accessorKey: "blogs",
        header: "Blogs",
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const data = row.original;
            return format(new Date(data.createdAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const data = row.original;
            return <TagAction tag={data} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: (Tag & {
            blogs: number;
        })[];
        count: number;
    };
}

export function TagsTable({ initialData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const {
        data: { data: dataRaw, count },
    } = trpc.general.tags.getTags.useQuery(undefined, {
        initialData,
    });

    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    const data = useMemo(
        () => dataRaw.slice((page - 1) * limit, page * limit),
        [dataRaw, page, limit]
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    return (
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

                <DataTableViewOptions table={table} />
            </div>

            <DataTable
                table={table}
                columns={columns}
                count={count}
                pages={pages}
            />
        </div>
    );
}
