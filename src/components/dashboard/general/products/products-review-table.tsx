"use client";

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
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
import { convertValueToLabel, formatPriceTag } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
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
import Link from "next/link";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo, useState } from "react";

export type TableProduct = ProductWithBrand & {
    stock: number;
    brandName: string;
};

const columns: ColumnDef<TableProduct>[] = [
    {
        accessorKey: "name",
        header: "Name",
        enableHiding: false,
    },
    {
        accessorKey: "brandName",
        header: "Brand",
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
            const data = row.original;
            return <span>{formatPriceTag(parseFloat(data.price), true)}</span>;
        },
    },
    {
        accessorKey: "stock",
        header: "Stock",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const data = row.original;
            return (
                <Badge
                    variant={
                        data.status === "approved"
                            ? "secondary"
                            : data.status === "rejected"
                              ? "destructive"
                              : "default"
                    }
                >
                    {convertValueToLabel(data.status)}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const data = row.original;
            return format(new Date(data.createdAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const data = row.original;
            return (
                <Button variant="ghost" className="size-8 p-0" asChild>
                    <Link href={`/dashboard/general/products/${data.id}`}>
                        <Icons.Eye className="size-4" />
                        <span className="sr-only">Review Product</span>
                    </Link>
                </Button>
            );
        },
    },
];

interface PageProps {
    initialData: {
        data: ProductWithBrand[];
        count: number;
    };
}

export function ProductsReviewTable({ initialData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });
    const [status, setStatus] = useQueryState(
        "status",
        parseAsStringLiteral([
            "idle",
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
    } = trpc.brands.products.getProducts.useQuery(
        { limit, page, search, status },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                stock: x.sizes.reduce((acc, x) => acc + x.quantity, 0),
                brandName: x.brand.name,
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
                        placeholder="Search by name..."
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

                    <Select
                        value={
                            (table
                                .getColumn("status")
                                ?.getFilterValue() as string) ?? status
                        }
                        onValueChange={(value) => {
                            table.getColumn("status")?.setFilterValue(value);
                            setStatus(value as TableProduct["status"]);
                        }}
                    >
                        <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Search by status" />
                        </SelectTrigger>
                        <SelectContent>
                            {["idle", "pending", "approved", "rejected"].map(
                                (x) => (
                                    <SelectItem key={x} value={x}>
                                        {convertValueToLabel(x)}
                                    </SelectItem>
                                )
                            )}
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
