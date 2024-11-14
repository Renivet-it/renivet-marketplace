"use client";

import { Badge } from "@/components/ui/badge";
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
import { UserWithAddressesAndRoles } from "@/lib/validations";
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
import { UserAction } from "./user-action";

export type TableUser = UserWithAddressesAndRoles & {
    name: string;
    joinedAt: string;
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
    },
    {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) => {
            const user = row.original;

            return (
                <div className="flex flex-wrap gap-1">
                    {!!user.roles.length ? (
                        user.roles.map((role) => (
                            <Badge key={role.id}>{role.name}</Badge>
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
            const user = row.original;
            return format(new Date(user.createdAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const user = row.original;
            return <UserAction user={user} />;
        },
    },
];

interface PageProps {
    initialUsers: (UserWithAddressesAndRoles & {
        userCount: number;
    })[];
}

export function UsersTable({ initialUsers }: PageProps) {
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

    trpc.roles.getRoles.useQuery();

    const { data: usersRaw } = trpc.users.getUsers.useQuery(
        { page, limit, search },
        { initialData: initialUsers }
    );

    const users = useMemo(
        () =>
            usersRaw.map((user) => ({
                ...user,
                name: `${user.firstName} ${user.lastName}`,
                joinedAt: format(new Date(user.createdAt), "MMM dd, yyyy"),
            })),
        [usersRaw]
    );

    const pages = useMemo(
        () => Math.ceil(usersRaw?.[0]?.userCount ?? 0 / limit) ?? 1,
        [usersRaw, limit]
    );

    const table = useReactTable({
        data: users,
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
                    {usersRaw?.[0]?.userCount ?? 0} users
                </p>

                <Pagination total={pages} />
            </div>
        </div>
    );
}
