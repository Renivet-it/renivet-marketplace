"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { BannedBrandMemberWithMember } from "@/lib/validations";
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
import { BanAction } from "./ban-action";

export type TableBan = BannedBrandMemberWithMember & {
    name: string;
};

const columns: ColumnDef<TableBan>[] = [
    {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => {
            const data = row.original;
            return <span className="break-words">{data.member.id}</span>;
        },
    },
    {
        accessorKey: "name",
        header: "Name",
        enableHiding: false,
    },
    {
        accessorKey: "bannedAt",
        header: "Banned At",
        cell: ({ row }) => {
            const data = row.original;
            return format(new Date(data.bannedAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const data = row.original;
            return <BanAction ban={data} />;
        },
    },
];

interface PageProps {
    brandId: string;
    initialData: {
        data: BannedBrandMemberWithMember[];
        count: number;
    };
}

export function BansTable({ brandId, initialData }: PageProps) {
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
    } = trpc.brands.bans.getBannedMembers.useQuery(
        { brandId, limit, page, search },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                name: `${x.member.firstName} ${x.member.lastName}`,
            })),
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
                        placeholder="Search by ID..."
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
                columns={columns}
                table={table}
                pages={pages}
                count={count}
            />
        </div>
    );

    return <></>;
}
