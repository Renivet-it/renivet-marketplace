"use client";

import { Badge } from "@/components/ui/badge";
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
import {
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
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
                    {formatPriceTag(
                        parseFloat(convertPaiseToRupees(data.price)),
                        true
                    )}
                </span>
            );
        },
    },
    {
        accessorKey: "categories",
        header: "Categories",
        cell: ({ row }) => {
            const data = row.original;

            return data.categories.length === 0 ? (
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
                                    <TableHead>Category</TableHead>
                                    <TableHead>Subcategory</TableHead>
                                    <TableHead className="text-right">
                                        Product Type
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {data.categories.map((x, i) => (
                                    <TableRow key={x.id}>
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell>{x.category.name}</TableCell>
                                        <TableCell>
                                            {x.subcategory.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {x.productType.name}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </PopoverContent>
                </Popover>
            );
        },
    },
    {
        accessorKey: "variants",
        header: "Variants",
        cell: ({ row }) => {
            const data = row.original;

            const toBeMapped = data.variants.filter((x) => !x.isDeleted);

            return toBeMapped.length === 0 ? (
                <span>N/A</span>
            ) : (
                <Popover>
                    <PopoverTrigger title="Click to view" className="underline">
                        View
                    </PopoverTrigger>

                    <PopoverContent className="max-h-60 w-auto overflow-scroll">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Count</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead>Availablity</TableHead>
                                    <TableHead className="text-right">
                                        Quantity
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {toBeMapped.map((x, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell>{x.size}</TableCell>
                                        <TableCell>
                                            <div
                                                key={i}
                                                title={x.color.name}
                                                className="size-5 rounded-full border border-foreground/20"
                                                style={{
                                                    backgroundColor:
                                                        x.color.hex,
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {x.isAvailable ? "Yes" : "No"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {x.quantity}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>

                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={4}>Total</TableCell>
                                    <TableCell className="text-right">
                                        {data.variants.reduce(
                                            (acc, x) => acc + x.quantity,
                                            0
                                        )}
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
