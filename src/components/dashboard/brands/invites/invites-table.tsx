"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { URLBuilder } from "@/lib/builders";
import { trpc } from "@/lib/trpc/client";
import { getAbsoluteURL } from "@/lib/utils";
import { BrandInvite } from "@/lib/validations";
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
import { toast } from "sonner";
import { InviteAction } from "./invite-action";

export type TableInvite = BrandInvite & {
    code: string;
};

const columns: ColumnDef<TableInvite>[] = [
    {
        accessorKey: "code",
        header: "Code",
        enableHiding: false,
        cell: ({ row }) => {
            const data = row.original;

            return (
                <button
                    className="flex items-center gap-1 underline"
                    onClick={() => {
                        const inviteLink = new URLBuilder(getAbsoluteURL())
                            .setPathTemplate("/i/:code")
                            .setPathParam("code", data.id)
                            .build();

                        navigator.clipboard.writeText(inviteLink);
                        toast.success("Invite link copied");
                    }}
                    title="Click to copy"
                >
                    {data.id}
                </button>
            );
        },
    },
    {
        accessorKey: "maxUses",
        header: "Max Uses",
        cell: ({ row }) => {
            const data = row.original;
            return data.maxUses === 0 ? "∞" : data.maxUses;
        },
    },
    {
        accessorKey: "uses",
        header: "Uses",
    },
    {
        accessorKey: "expiresAt",
        header: "Expires At",
        cell: ({ row }) => {
            const data = row.original;
            return data.expiresAt
                ? format(new Date(data.expiresAt), "MMM dd, yyyy")
                : "∞";
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const data = row.original;
            return <InviteAction invite={data} />;
        },
    },
];

interface PageProps {
    brandId: string;
    initialData: {
        data: BrandInvite[];
        count: number;
    };
}

export function InvitesTable({ initialData, brandId }: PageProps) {
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
    } = trpc.brands.invites.getInvites.useQuery({ brandId }, { initialData });

    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    const data = useMemo(
        () =>
            dataRaw
                .map((invite) => ({
                    ...invite,
                    code: invite.id,
                }))
                .slice((page - 1) * limit, page * limit),
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
                        placeholder="Search by code..."
                        value={
                            (table
                                .getColumn("code")
                                ?.getFilterValue() as string) ?? ""
                        }
                        onChange={(event) =>
                            table
                                .getColumn("code")
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
