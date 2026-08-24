"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { displayCustomerEmail } from "@/lib/email-display";
import { trpc } from "@/lib/trpc/client";
import { UserWithAddressesRolesAndBrand } from "@/lib/validations";
import {
    ColumnDef,
    ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { UserAction } from "./user-action";

export type TableUser = UserWithAddressesRolesAndBrand & {
    name: string;
    roleNames: string;
};

const columns: ColumnDef<TableUser>[] = [
    {
        accessorKey: "name",
        header: "Name",
        enableHiding: false,
    },
    {
        accessorKey: "email",
        header: "Email",
        enableHiding: false,
        cell: ({ row }) => displayCustomerEmail(row.original.email),
    },
    {
        accessorKey: "phone",
        header: "Phone Number",
        cell: ({ row }) => row.original.phone ?? "—",
    },
    {
        accessorKey: "roleNames",
        header: "Roles",
        cell: ({ row }) => {
            const roles = row.original.roles;

            return roles.length ? (
                <div className="flex flex-wrap gap-1">
                    {roles.map((role) => (
                        <Badge key={role.id} variant="secondary">
                            {role.name}
                        </Badge>
                    ))}
                </div>
            ) : (
                "—"
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) =>
            format(new Date(row.original.createdAt), "MMM dd, yyyy"),
    },
    {
        id: "actions",
        cell: ({ row }) => <UserAction user={row.original} />,
    },
];

interface PageProps {
    initialData: {
        data: UserWithAddressesRolesAndBrand[];
        count: number;
    };
}

export function UsersTable({ initialData }: PageProps) {
    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(1)
    );
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", { defaultValue: "" });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const { data: queryData } = trpc.general.users.getUsers.useQuery(
        { page, limit, search: search || undefined },
        { initialData }
    );
    const dataRaw = queryData?.data ?? [];
    const count = queryData?.count ?? 0;
    const data = useMemo<TableUser[]>(
        () =>
            dataRaw.map((user) => ({
                ...user,
                name: `${user.firstName} ${user.lastName}`.trim(),
                roleNames: user.roles.map((role) => role.name).join(", "),
            })),
        [dataRaw]
    );
    const pages = useMemo(() => Math.ceil(count / limit) || 1, [count, limit]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        pageCount: pages,
        manualPagination: true,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: { pageIndex: page - 1, pageSize: limit },
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Search by email..."
                    value={
                        (table
                            .getColumn("email")
                            ?.getFilterValue() as string) ?? search
                    }
                    onChange={(event) => {
                        table
                            .getColumn("email")
                            ?.setFilterValue(event.target.value);
                        setSearch(event.target.value);
                        setPage(1);
                    }}
                />
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
