"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import {
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { Order } from "@/lib/validations";
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
import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { OrderAction } from "./order-action";

export type TableOrder = Order;

const columns = (onAction: () => void): ColumnDef<TableOrder>[] => [
    {
        accessorKey: "id",
        header: "Order ID",
        enableHiding: false,
        cell: ({ row }) => {
            const data = row.original;
            return (
                <Link
                    className="text-blue-500 hover:underline"
                    href={window.location.pathname + "/" + data.id}
                >
                    {data.id}
                </Link>
            );
        },
    },
    {
        accessorKey: "fullName",
        header: "Customer Name",
        cell: ({ row }) => {
            const data = row.original;
            return `${data.firstName} ${data.lastName}`; // Combine firstName and lastName
        },
    },
    {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => {
            const data = row.original;
            return formatPriceTag(
                +convertPaiseToRupees(data.totalAmount),
                true
            );
        },
    },
    {
        accessorKey: "totalItems",
        header: "Total Items",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const data = row.original;
            return <Badge>{convertValueToLabel(data.status)}</Badge>;
        },
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
                return <OrderAction order={data} onAction={onAction}/>;
            },
     },
];

interface PageProps {
    initialData: Order[];
    brandId: string;
}

export function OrdersTable({ initialData, brandId }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const { data: dataRaw, refetch: refetchOrderData } = trpc.brands.orders.getOrdersByBrandId.useQuery(
        { brandId },
        { initialData }
    );

    const data = useMemo(
        () => dataRaw.map((x) => x).slice((page - 1) * limit, page * limit),
        [dataRaw, page, limit]
    );

    const count = data.length;
    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    const table = useReactTable({
        data,
        columns: columns(refetchOrderData),
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
                        placeholder="Search by order id..."
                        value={
                            (table
                                .getColumn("id")
                                ?.getFilterValue() as string) ?? ""
                        }
                        onChange={(event) =>
                            table
                                .getColumn("id")
                                ?.setFilterValue(event.target.value)
                        }
                    />
                </div>

                <DataTableViewOptions table={table} />
            </div>

            <DataTable
                columns={columns(refetchOrderData)}
                table={table}
                pages={pages}
                count={count}
            />
        </div>
    );
}
