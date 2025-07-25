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
import { OrderWithItemAndBrand } from "@/lib/validations";
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
import { OrderAction } from "./order-action";
import { OrderSingle } from "./order-single";

export type TableOrder = OrderWithItemAndBrand;

const columns= (onAction: () => void): ColumnDef<TableOrder>[] => [
    {
        accessorKey: "id",
        header: "Order Intent ID",
        enableHiding: false,
        cell: ({ row }) => {
            const data = row.original;
            return `${data?.id}`;
        },
    },
    // {
    //     accessorKey: "userId",
    //     header: "Customer ID",
    // },
    {
        accessorKey: "user_id",
        header: "Customer Name",
        cell: ({ row }) => {
            const data = row.original;
         return `${data?.user?.firstName} ${data?.user?.lastName}`;

        },
    },
    {
        accessorKey: "title",
        header: "Product Name",
        cell: ({ row }) => {
            const data = row.original;
            // @ts-ignore
         return `${data?.product?.title}`;

        },
    },
    // {
    //     accessorKey: "totalAmount",
    //     header: "Total",
    //     cell: ({ row }) => {
    //         const data = row.original;
    //         return formatPriceTag(
    //             +convertPaiseToRupees(data.totalAmount),
    //             true
    //         );
    //     },
    // },
    // {
    //     accessorKey: "totalItems",
    //     header: "Total Items",
    // },
    // {
    //     accessorKey: "status",
    //     header: "Status",
    //     cell: ({ row }) => {
    //         const data = row.original;
    //         return <Badge>{convertValueToLabel(data.status)}</Badge>;
    //     },
    // },
        {
        accessorKey: "payment_status",
        header: "Payment Status",
        cell: ({ row }) => {
            const data = row.original;
            // @ts-ignore
         return `${data?.paymentStatus}`;

        },
    },
    {
        accessorKey: "createdAt",
        header: "Intended Time",
        cell: ({ row }) => {
            const data = row.original;
           return format(new Date(data.createdAt), "MMM dd, yyyy 'at' h:mm a");
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
    initialData: {
        data: OrderWithItemAndBrand[];
        count: number;
    };
}

export function OrdersTable({ initialData }: PageProps) {
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
    const {
        data: { data: dataRaw, count },
        refetch: refetchOrderData,
        //@ts-ignore
    } = trpc.general.orders.getAllIntents.useQuery(
        { page, limit, search },
        { initialData }
    );
        //@ts-ignore
    const data = useMemo(() => dataRaw.map((x) => x), [dataRaw]);

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
                                ?.getFilterValue() as string) ?? search
                        }
                        onChange={(event) => {
                            table
                                .getColumn("id")
                                ?.setFilterValue(event.target.value);
                            setSearch(event.target.value);
                        }}
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
