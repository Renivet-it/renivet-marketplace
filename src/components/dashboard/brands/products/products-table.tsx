"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
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
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { ProductAction } from "./product-action";

export type TableProduct = ProductWithBrand & {
    visibility: boolean;
    stock: number;
};

const columns: ColumnDef<TableProduct>[] = [
    {
        accessorKey: "name",
        header: "Name",
        enableHiding: false,
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
            const data = row.original;
            return (
                <span>
                    {Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "INR",
                    }).format(parseFloat(data.price))}
                </span>
            );
        },
    },
    {
        accessorKey: "sizes",
        header: "Sizes",
        cell: ({ row }) => {
            const data = row.original;

            return data.sizes.length === 0 ? (
                <span>N/A</span>
            ) : (
                <Popover>
                    <PopoverTrigger title="Click to view" className="underline">
                        View
                    </PopoverTrigger>

                    <PopoverContent className="w-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Count</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead className="text-right">
                                        Quantity
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {data.sizes.map((x, i) => (
                                    <TableRow key={x.name}>
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell>{x.name}</TableCell>
                                        <TableCell className="text-right">
                                            {x.quantity}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>

                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={2}>Total</TableCell>
                                    <TableCell className="text-right">
                                        {data.stock}
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </PopoverContent>
                </Popover>
            );
        },
    },
    {
        accessorKey: "stock",
        header: "Stock",
    },
    {
        accessorKey: "colors",
        header: "Colors",
        cell: ({ row }) => {
            const data = row.original;

            return data.colors.length === 0 ? (
                <span>N/A</span>
            ) : (
                <div className="flex gap-1">
                    {data.colors.slice(0, 3).map((color, i) => (
                        <div
                            key={i}
                            title={
                                data.colors.length > 3 && i === 2
                                    ? data.colors
                                          .slice(2)
                                          .map((x) => x.name)
                                          .join(", ")
                                    : color.name
                            }
                            className={cn(
                                "size-5 rounded-full",
                                data.colors.length > 3 && i === 2 && "relative"
                            )}
                            style={{
                                backgroundColor:
                                    data.colors.length > 3 && i === 2
                                        ? "#000"
                                        : color.hex,
                            }}
                        >
                            {data.colors.length > 3 && i === 2 && (
                                <span className="absolute inset-0 flex size-full cursor-default items-center justify-center text-xs text-background">
                                    +3
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            );
        },
    },
    {
        accessorKey: "isAvailable",
        header: "Available",
        cell: ({ row }) => {
            const data = row.original;
            return data.isAvailable ? "Yes" : "No";
        },
    },
    {
        accessorKey: "visibility",
        header: "Visibility",
        cell: ({ row }) => {
            const data = row.original;
            return data.visibility ? "Public" : "Private";
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
            return <ProductAction product={data} />;
        },
    },
];

interface PageProps {
    brandId: string;
    initialData: {
        data: ProductWithBrand[];
        count: number;
    };
}

export function ProductsTable({ brandId, initialData }: PageProps) {
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
    } = trpc.brands.products.getProducts.useQuery(
        { brandIds: [brandId], limit, page, search },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                visibility: x.isPublished,
                stock: x.sizes.reduce((acc, x) => acc + x.quantity, 0),
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
