"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { BrandMemberWithMemberAndRoles } from "@/lib/validations";
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
import { MemberAction } from "./member-action";

export type TableMember = BrandMemberWithMemberAndRoles & {
    name: string;
    email: string;
};

const columns: ColumnDef<TableMember>[] = [
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
        cell: ({ row }) => {
            const data = row.original;
            return data.isOwner ? (
                <div className="space-x-1">
                    <span>{data.name}</span>
                    <span className="text-muted-foreground">(Owner)</span>
                </div>
            ) : (
                <span>{data.name}</span>
            );
        },
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) => {
            const data = row.original;
            const filtered = data.roles.filter((role) => !role.isSiteRole);

            return (
                <div className="flex flex-wrap gap-1">
                    {!!filtered.length ? (
                        filtered.map((data) => (
                            <Badge key={data.id}>{data.name}</Badge>
                        ))
                    ) : (
                        <Badge variant="secondary">General</Badge>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "joinedAt",
        header: "Joined At",
        cell: ({ row }) => {
            const data = row.original;
            return format(new Date(data.createdAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const data = row.original;
            return <MemberAction data={data} />;
        },
    },
];

interface PageProps {
    brandId: string;
    initialData: {
        data: BrandMemberWithMemberAndRoles[];
        count: number;
    };
}

export function MembersTable({ brandId, initialData }: PageProps) {
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

    trpc.brands.roles.getRoles.useQuery({ id: brandId });

    const {
        data: { data: dataRaw, count },
    } = trpc.brands.members.getMembers.useQuery(
        { brandId, limit, page, search },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                name: `${x.member.firstName} ${x.member.lastName}`,
                email: x.member.email,
                joinedAt: format(new Date(x.createdAt), "MMM dd, yyyy"),
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
}
