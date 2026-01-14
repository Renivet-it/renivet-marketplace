"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { CachedBrand } from "@/lib/validations";
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
import { BrandAction } from "./brand-action";

export type TableBrand = CachedBrand & {
    ownerName: string;
    memberCount: number;
    subscribedTo: string;
};

const columns: ColumnDef<TableBrand>[] = [
    {
        accessorKey: "id",
        header: "ID",
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Name",
        enableHiding: false,
    },
    {
        accessorKey: "email",
        header: "Email",
        enableHiding: false,
    },
    {
        accessorKey: "subscribedTo",
        header: "Subscribed To",
    },
    {
        accessorKey: "ownerName",
        header: "Owner",
    },
    {
        accessorKey: "memberCount",
        header: "Members",
    },

    {
        accessorKey: "phone",
        header: "Phone Number",
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
            const isActive = row.original.isActive;
            return (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                    }`}
                >
                    {isActive ? "Active" : "Inactive"}
                </span>
            );
        },
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
        cell: ({ row }) => <BrandAction brand={row.original} />,
    },
];

interface PageProps {
    initialData: {
        data: CachedBrand[];
        count: number;
    };
}

export function BrandsTable({ initialData }: PageProps) {
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
    } = trpc.general.brands.getBrands.useQuery(
        { page, limit, search },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => {
                const subscribedPlan = x.subscriptions.find((s) => s.isActive);

                return {
                    ...x,
                    ownerName: `${x.owner.firstName} ${x.owner.lastName}`,
                    memberCount: x.members.length,
                    subscribedTo: subscribedPlan?.plan.name ?? "N/A",
                };
            }),
        [dataRaw]
    );

    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

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
                        placeholder="Search by brand name..."
                        value={
                            (table
                                .getColumn("name")
                                ?.getFilterValue() as string) ?? search
                        }
                        onChange={(event) => {
                            table
                                .getColumn("name")
                                ?.setFilterValue(event.target.value);
                            setSearch(event.target.value);
                        }}
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
