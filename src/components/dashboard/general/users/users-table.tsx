"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { UserWithAddressesRolesAndBrand } from "@/lib/validations";
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
import { Download } from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserAction } from "./user-action";

export type TableUser = UserWithAddressesRolesAndBrand & {
    name: string;
    joinedAt: string;
};

const getAddressPhone = (user: UserWithAddressesRolesAndBrand) =>
    user.addresses.find((address) => address.isPrimary)?.phone ||
    user.addresses[0]?.phone ||
    user.phone ||
    "N/A";

const escapeCsvValue = (value: string | number | null | undefined) => {
    const stringValue = value === null || value === undefined ? "" : String(value);
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
};

const downloadCsv = (fileName: string, rows: Record<string, string | number>[]) => {
    const headers = Object.keys(rows[0] ?? {});
    const csv = [
        headers.map(escapeCsvValue).join(","),
        ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
};

const buildExportRows = (users: TableUser[]) =>
    users.map((user) => {
        const siteRoles = user.roles
            .filter((role) => role.isSiteRole)
            .map((role) => role.name)
            .join(", ");

        return {
            Name: user.name,
            Email: user.email || "N/A",
            "User Phone": user.phone || "N/A",
            "Address Phone": getAddressPhone(user),
            Roles: siteRoles || "General",
            Brand: user.brand?.name || "N/A",
            "Joined At": user.joinedAt,
        };
    });

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
        cell: ({ row }) => row.original.email || "N/A",
    },
    {
        id: "addressPhone",
        header: "Address Phone",
        cell: ({ row }) => getAddressPhone(row.original),
    },
    {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) => {
            const data = row.original;
            const filtered = data.roles.filter((role) => role.isSiteRole);

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
            return <UserAction user={data} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: UserWithAddressesRolesAndBrand[];
        count: number;
    };
}

export function UsersTable({ initialData }: PageProps) {
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

    trpc.general.roles.getRoles.useQuery();

    const {
        data: queryData,
    } = trpc.general.users.getUsers.useQuery(
        { page, limit, search },
        { initialData }
    );
    const { refetch: refetchAllUsers, isFetching: isExporting } =
        trpc.general.users.getAllUsers.useQuery(
            { search },
            {
                enabled: false,
                refetchOnWindowFocus: false,
            }
        );
    const dataRaw = queryData?.data ?? [];
    const count = queryData?.count ?? 0;

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                name: `${x.firstName} ${x.lastName}`,
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

    const handleExport = async () => {
        const { data: allUsers } = await refetchAllUsers();
        const rows = buildExportRows(
            (allUsers ?? []).map((user) => ({
                ...user,
                name: `${user.firstName} ${user.lastName}`,
                joinedAt: format(new Date(user.createdAt), "MMM dd, yyyy"),
            }))
        );

        if (!rows.length) {
            toast.error("No users to export");
            return;
        }

        downloadCsv(
            `renivet_users_export_${new Date().toISOString().split("T")[0]}.csv`,
            rows
        );
        toast.success(`Exported ${rows.length} users`);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        <Download className="size-4" />
                        {isExporting ? "Exporting..." : "Export"}
                    </Button>
                    <DataTableViewOptions table={table} />
                </div>
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
