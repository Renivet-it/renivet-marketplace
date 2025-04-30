"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-dash";
import { Input } from "@/components/ui/input-dash";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { ProductAction } from "./product-action";

export type TableProduct = ProductWithBrand & {
    visibility: boolean;
    stock: number;
};
type ImageFilter = "with" | "without" | "all";
type VisiblityFilter = "private" | "public" | "all";

const columns: ColumnDef<TableProduct>[] = [
    {
        accessorKey: "title",
        header: "Title",
        enableHiding: false,
        cell: ({ row }) => (
            <div className="w-56 whitespace-normal break-words px-2 py-1">
                {row.original.title}
            </div>
        ),
    },
    {
        accessorKey: "nativeSku",
        header: "Native SKU",
        cell: ({ row }) => {
            const data = row.original;
            return (
                <span className="whitespace-nowrap">
                    {data.nativeSku || "N/A"}
                </span>
            );
        },
    },
    {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
            const data = row.original;

            if (!data.productHasVariants) {
                const price = formatPriceTag(
                    parseFloat(convertPaiseToRupees(data.price ?? 0)),
                    true
                );

                return <span>{price}</span>;
            }

            const minPriceRaw = Math.min(...data.variants.map((x) => x.price));
            const maxPriceRaw = Math.max(...data.variants.map((x) => x.price));

            const minPrice = formatPriceTag(
                parseFloat(convertPaiseToRupees(minPriceRaw)),
                true
            );
            const maxPrice = formatPriceTag(
                parseFloat(convertPaiseToRupees(maxPriceRaw)),
                true
            );

            if (minPriceRaw === maxPriceRaw) return <span>{minPrice}</span>;
            return (
                <span className="whitespace-nowrap">
                    {minPrice} - {maxPrice}
                </span>
            );
        },
    },
    {
        accessorKey: "stock",
        header: "Stock",
    },
    {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
            const data = row.original;
            return (
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger className="underline">
                            View
                        </TooltipTrigger>

                        <TooltipContent>
                            <p>
                                {data.category.name} &gt;{" "}
                                {data.subcategory.name} &gt;{" "}
                                {data.productType.name}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
    {
        accessorKey: "variants",
        header: "Variants",
        cell: ({ row }) => {
            const data = row.original;

            return data.variants.length === 0 ? (
                <span>N/A</span>
            ) : (
                <Dialog>
                    <DialogTrigger className="underline">
                        View ({data.variants.length})
                    </DialogTrigger>

                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>
                                Variants of &quot;{data.title}&quot;
                            </DialogTitle>
                            <DialogDescription>
                                {data.variants.length} variants
                            </DialogDescription>
                        </DialogHeader>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Variant</TableHead>
                                    <TableHead>Native SKU</TableHead>
                                    <TableHead>Custom SKU</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {data.variants.map((variant) => {
                                    const variantName = Object.entries(
                                        variant.combinations
                                    )
                                        .map(([optionId, valueId]) => {
                                            const option = data.options.find(
                                                (opt) => opt.id === optionId
                                            );
                                            const value = option?.values.find(
                                                (val) => val.id === valueId
                                            );
                                            return value?.name;
                                        })
                                        .filter(Boolean)
                                        .join(" / ");

                                    return (
                                        <TableRow key={variant.id}>
                                            <TableCell>{variantName}</TableCell>

                                            <TableCell>
                                                {variant.nativeSku}
                                            </TableCell>

                                            <TableCell>
                                                {variant.sku || "N/A"}
                                            </TableCell>

                                            <TableCell>
                                                {formatPriceTag(
                                                    parseFloat(
                                                        convertPaiseToRupees(
                                                            variant.price
                                                        )
                                                    ),
                                                    true
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {variant.quantity}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>

                            <TableFooter>
                                <TableRow>
                                    <TableCell colSpan={4}>Total</TableCell>
                                    <TableCell>
                                        {data.variants.reduce(
                                            (acc, variant) =>
                                                acc + variant.quantity,
                                            0
                                        )}
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </DialogContent>
                </Dialog>
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
        accessorKey: "isActive",
        header: "Active",
        cell: ({ row }) => {
            const data = row.original;
            return data.isActive ? "Yes" : "No";
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
        accessorKey: "verificationStatus",
        header: "Status",
        cell: ({ row }) => {
            const data = row.original;

            return (
                <Badge
                    variant={
                        data.verificationStatus === "approved"
                            ? "secondary"
                            : data.verificationStatus === "rejected"
                              ? "destructive"
                              : "default"
                    }
                >
                    {convertValueToLabel(data.verificationStatus)}
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
    const [productImage, setImageFilter] = useQueryState(
        "productImage",
        parseAsStringLiteral(["with", "without", "all"] as const).withDefault(
            "all"
        )
    );
     const [productVisiblity, setVisiblityFilter] = useQueryState(
            "productVisiblity",
            parseAsStringLiteral(["private", "public", "all"] as const).withDefault(
                "public"
            )
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
        { brandIds: [brandId], limit, page, productImage, productVisiblity, search },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => {
                const stock = x.productHasVariants
                    ? x.variants.reduce((acc, curr) => acc + curr.quantity, 0)
                    : (x.quantity ?? 0);

                return {
                    ...x,
                    visibility: x.isPublished,
                    stock,
                };
            }),
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
                {/* <div className="w-full md:w-auto"> */}
                    <Input
                        placeholder="Search by name..."
                        value={
                            (table
                                .getColumn("title")
                                ?.getFilterValue() as string) ?? search
                        }
                        onChange={(event:any) => {
                            table
                                .getColumn("name")
                                ?.setFilterValue(event.target.value);
                            setSearch(event.target.value);
                        }}
                    />
                {/* </div> */}
                <Select
                        onValueChange={(value: ImageFilter) =>
                            setImageFilter(value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Image" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="with">With Image</SelectItem>
                            <SelectItem value="without">
                                Without Image
                            </SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        onValueChange={(value: VisiblityFilter) =>
                            setVisiblityFilter(value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Visiblity" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">
                               Private
                            </SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                    </Select>
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
