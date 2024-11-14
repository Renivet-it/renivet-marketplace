"use client";

import {
    DataTableViewOptions,
    Pagination,
} from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { BrandWaitlist } from "@/lib/validations";
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
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { WaitlistAction } from "./waitlist-action";

export type TableWaitlist = BrandWaitlist & {
    registrant: string;
};

const columns: ColumnDef<TableWaitlist>[] = [
    {
        accessorKey: "brandName",
        header: "Name",
        enableHiding: false,
    },
    {
        accessorKey: "brandEmail",
        header: "Email",
        enableHiding: false,
    },
    {
        accessorKey: "brandPhone",
        header: "Phone",
    },
    {
        accessorKey: "registrant",
        header: "Registrant",
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const waitlist = row.original;
            return format(new Date(waitlist.createdAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const waitlist = row.original;
            return <WaitlistAction waitlist={waitlist} />;
        },
    },
];

interface PageProps {
    initialData: (BrandWaitlist & {
        waitlistCount: number;
    })[];
}

export function WaitlistTable({ initialData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const { data: waitlistRaw } =
        trpc.brandsWaitlist.getBrandsWaitlist.useQuery(
            { page, limit, search },
            { initialData }
        );

    const waitlist = useMemo(
        () =>
            waitlistRaw.map((waitlist) => ({
                ...waitlist,
                registrant: waitlist.name,
            })),
        [waitlistRaw]
    );

    const pages = useMemo(
        () => Math.ceil(waitlistRaw?.[0]?.waitlistCount / limit) ?? 1,
        [waitlistRaw, limit]
    );

    const table = useReactTable({
        data: waitlist,
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
                        placeholder="Search by brand name..."
                        value={
                            (table
                                .getColumn("brandName")
                                ?.getFilterValue() as string) ?? search
                        }
                        onChange={(event) => {
                            table
                                .getColumn("brandName")
                                ?.setFilterValue(event.target.value);
                            setSearch(event.target.value);
                        }}
                    />
                </div>

                <DataTableViewOptions table={table} />
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
                                                      header.column.columnDef
                                                          .header,
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
                                        <TableCell
                                            key={cell.id}
                                            className="max-w-60"
                                        >
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

            <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    Showing {table.getRowModel().rows?.length ?? 0} of{" "}
                    {waitlistRaw?.[0]?.waitlistCount ?? 0} results
                </p>

                <Pagination total={pages} />
            </div>
        </div>
    );
}
