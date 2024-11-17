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
import { NewsletterSubscriber } from "@/lib/validations";
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
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { SubscriberAction } from "./subscriber-action";

export type TableSubscriber = NewsletterSubscriber & {
    status: string;
};

const columns: ColumnDef<TableSubscriber>[] = [
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const subscriber = row.original;

            return (
                <Badge
                    variant={subscriber.isActive ? "default" : "destructive"}
                >
                    {convertValueToLabel(subscriber.status)}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const subscriber = row.original;
            return format(new Date(subscriber.createdAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const subscriber = row.original;
            return <SubscriberAction subscriber={subscriber} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: NewsletterSubscriber[];
        count: number;
    };
}

export function SubscribersTable({ initialData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });
    const [isActive, setIsActive] = useQueryState(
        "isActive",
        parseAsBoolean.withDefault(true)
    );

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const {
        data: { data: dataRaw, count },
    } = trpc.newsletterSubscribers.getNewsletterSubscribers.useQuery(
        { page, limit, search, isActive },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                status: x.isActive ? "Active" : "Inactive",
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
                                ?.getFilterValue() as string) ??
                            (isActive !== undefined || isActive === true
                                ? "active"
                                : "inactive")
                        }
                        onValueChange={(value) => {
                            table.getColumn("status")?.setFilterValue(value);
                            setIsActive(value === "active" ? true : false);
                        }}
                    >
                        <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Search by status" />
                        </SelectTrigger>
                        <SelectContent>
                            {["active", "inactive"].map((x) => (
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
                columns={columns}
                table={table}
                pages={pages}
                count={count}
            />
        </div>
    );
}
