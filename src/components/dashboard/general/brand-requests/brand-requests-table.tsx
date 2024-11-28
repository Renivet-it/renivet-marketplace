"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { trpc } from "@/lib/trpc/client";
import { convertValueToLabel } from "@/lib/utils";
import { BrandRequestWithOwner } from "@/lib/validations";
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
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { BrandRequestAction } from "./brand-request-action";

export type TableBrandRequests = BrandRequestWithOwner & {
    registrant: string;
    registrantEmail: string;
};

const columns: ColumnDef<TableBrandRequests>[] = [
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
        accessorKey: "registrant",
        header: "Registrant",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const request = row.original;

            return (
                <Badge
                    variant={
                        request.status === "pending"
                            ? "default"
                            : request.status === "approved"
                              ? "secondary"
                              : "destructive"
                    }
                >
                    {convertValueToLabel(request.status)}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const request = row.original;
            return format(new Date(request.createdAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const request = row.original;
            return <BrandRequestAction request={request} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: BrandRequestWithOwner[];
        count: number;
    };
}

export function BrandRequestsTable({ initialData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });
    const [status, setStatus] = useQueryState(
        "status",
        parseAsStringLiteral([
            "pending",
            "approved",
            "rejected",
        ] as const).withDefault("pending")
    );

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const {
        data: { data: dataRaw, count },
    } = trpc.general.brands.requests.getRequests.useQuery(
        { page, limit, search, status },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                registrant: `${x.owner.firstName} ${x.owner.lastName}`,
                registrantEmail: x.owner.email,
            })),
        [dataRaw]
    );

    const pages = useMemo(() => Math.ceil(count / limit), [count, limit]);

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
                <div className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
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

                    <Select
                        value={
                            (table
                                .getColumn("status")
                                ?.getFilterValue() as string) ?? status
                        }
                        onValueChange={(value) => {
                            table.getColumn("status")?.setFilterValue(value);
                            setStatus(value as TableBrandRequests["status"]);
                        }}
                    >
                        <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Search by status" />
                        </SelectTrigger>
                        <SelectContent>
                            {["pending", "approved", "rejected"].map((x) => (
                                <SelectItem key={x} value={x}>
                                    {convertValueToLabel(x)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
