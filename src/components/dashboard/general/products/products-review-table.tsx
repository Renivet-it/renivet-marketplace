"use client";

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-dash";
import { DialogHeader } from "@/components/ui/dialog-general";
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
import Link from "next/link";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { ProductAction } from "./product-admin-action";
import { useQueryClient } from "@tanstack/react-query";
export type TableProduct = ProductWithBrand & {
    stock: number;
    brandName: string;
    visibility: boolean; // Make this optional
};

type ImageFilter = "with" | "without" | "all";

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
        accessorKey: "brandName",
        header: "Brand",
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
    // {
    //     id: "actions",
    //     cell: ({ row }) => {
    //         const data = row.original;
    //         return (
    //             <Button variant="ghost" className="size-8 p-0" asChild>
    //                 <Link href={`/dashboard/general/products/${data.id}`}>
    //                     <Icons.Eye className="size-4" />
    //                     <span className="sr-only">Review Product</span>
    //                 </Link>
    //             </Button>
    //         );
    //     },
    // },

    // {
    //     id: "actions",
    //     cell: ({ row }) => {
    //         const data = row.original;
    //         return <ProductAction product={data} />;
    //     },
    // },
        {
            accessorKey: "visibility",
            header: "Visibility",
            cell: ({ row }) => {
                const data = row.original;
                return data.visibility ? "Public" : "Private";
            },
        },
    {
        id: "actions",
        cell: ({ row }) => {
            const data = row.original;
            return <ProductAction product={{ ...data, visibility: data.visibility ?? true }} />;
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
    const [productImage, setImageFilter] = useQueryState(
        "productImage",
        parseAsStringLiteral([
            "with",
            "without",
            "all",
        ] as const).withDefault("all")
    );

    const [verificationStatus, setVerificationStatus] = useQueryState(
        "verificationStatus",
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
        { limit, page, search, verificationStatus, productImage },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                stock: x.productHasVariants
                    ? x.variants.reduce((acc, curr) => acc + curr.quantity, 0)
                    : (x.quantity ?? 0),
                brandName: x.brand.name,
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
                <div className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
                    <Input
                        placeholder="Search by title..."
                        value={
                            (table
                                .getColumn("title")
                                ?.getFilterValue() as string) ?? search
                        }
                        onChange={(event) => {
                            table
                                .getColumn("title")
                                ?.setFilterValue(event.target.value);
                            setSearch(event.target.value);
                        }}
                    />

                    <Select
                        value={
                            (table
                                .getColumn("verificationStatus")
                                ?.getFilterValue() as string) ??
                            verificationStatus
                        }
                        onValueChange={(value) => {
                            table
                                .getColumn("verificationStatus")
                                ?.setFilterValue(value);
                            setVerificationStatus(
                                value as TableProduct["verificationStatus"]
                            );
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
                    <Select onValueChange={(value: ImageFilter) => setImageFilter(value)}>
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
                </div>

                <DataTableViewOptions table={table} />
            </div>

            <DataTable
                columns={columns as ColumnDef<any>[]}
                table={table}
                pages={pages}
                count={count}
            />
        </div>
    );
}
