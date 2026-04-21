"use client";

import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Checkbox } from "@/components/ui/checkbox";
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
import { CachedBrand, ProductWithBrand } from "@/lib/validations";
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
import {
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryState,
} from "nuqs";
import { useMemo, useState } from "react";
import { ProductAction } from "./product-admin-action";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type TableProduct = ProductWithBrand & {
    stock: number;
    brandName: string;
    visibility: boolean;
};

type ImageFilter = "with" | "without" | "all";
type VisiblityFilter = "private" | "public" | "all";

const columns: ColumnDef<TableProduct>[] = [
    {
        id: "select",
        enableHiding: false,
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all rows"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
    },
    {
        accessorKey: "title",
        header: () => <div className="min-w-[16rem]">Title</div>,
        enableHiding: false,
        cell: ({ row }) => (
            <div className="min-w-[16rem] max-w-[20rem] px-2 py-1">
                <p
                    className="line-clamp-2 leading-snug break-words"
                    title={row.original.title}
                >
                    {row.original.title}
                </p>
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
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                            >
                                <Icons.Info className="size-4" />
                                <span className="sr-only">
                                    View category details
                                </span>
                            </Button>
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
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 gap-1 px-2 text-xs"
                            title="View variants"
                        >
                            <Icons.Layers className="size-4" />
                            {data.variants.length}
                        </Button>
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
                    className="capitalize"
                >
                    {convertValueToLabel(data.verificationStatus)}
                </Badge>
            );
        },
    },
    {
        accessorKey: "visibility",
        header: "Visibility",
        cell: ({ row }) => {
            const data = row.original;
            return (
                <Badge
                    variant={data.visibility ? "secondary" : "outline"}
                    className={
                        data.visibility
                            ? "bg-sky-100 text-sky-700 hover:bg-sky-100/90"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-100/90"
                    }
                >
                    {data.visibility ? "Public" : "Private"}
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
        enableHiding: false,
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
            const data = row.original;
            return (
                <div className="flex items-center justify-end gap-1 py-1">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    asChild
                                >
                                    <Link
                                        href={`/dashboard/general/products/preview-form/${data.id}`}
                                        target="_blank"
                                    >
                                        <Icons.Edit className="size-4" />
                                        <span className="sr-only">
                                            Edit product
                                        </span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {data.isPublished && (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        asChild
                                    >
                                        <Link
                                            href={`/products/${data.slug}`}
                                            target="_blank"
                                        >
                                            <Icons.ExternalLink className="size-4" />
                                            <span className="sr-only">
                                                View live product
                                            </span>
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>View live</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <ProductAction
                        product={{ ...data, visibility: data.visibility ?? true }}
                    />
                </div>
            );
        },
    },
];

// interface PageProps {
//     initialData: {
//         data: ProductWithBrand[];
//         count: number;
//     };
// }

interface PageProps {
    initialData: {
        data: ProductWithBrand[];
        count: number;
    };
    brandData?: {
        data: CachedBrand[];
        count: number;
    };
}

export function ProductsReviewTable({ initialData, brandData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(15));
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
            "all"
        )
    );
    const [brandIds, setBrandIds] = useQueryState(
        "brandIds",
        parseAsArrayOf(parseAsString).withDefault([])
    );
    const [verificationStatus, setVerificationStatus] = useQueryState(
        "verificationStatus",
        parseAsStringLiteral([
            "all",
            "idle",
            "pending",
            "approved",
            "rejected",
        ] as const).withDefault("all")
    );

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});
    const { data: brandsData } = trpc.general.brands.getBrands.useQuery(
        {
            page: 1, // Always fetch from first page
            limit: 150, // Use total count to fetch all brands
            search,
        },
        {
            initialData: brandData, // Use brandData prop
        }
    );

    const {
        data: queryData,
    } = trpc.brands.products.getProducts.useQuery(
        {
            limit,
            page,
            search,
            verificationStatus:
                verificationStatus === "all" ? undefined : verificationStatus,
            productImage,
            productVisiblity,
            brandIds: brandIds.length > 0 ? brandIds : undefined,
        },
        { initialData }
    );
    const dataRaw = queryData?.data ?? [];
    const count = queryData?.count ?? 0;

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

    const selectedProducts = table.getSelectedRowModel().rows.map(
        (row) => row.original
    );

    const clearAllFilters = () => {
        table.resetColumnFilters();
        void setSearch("");
        void setVerificationStatus("all");
        void setImageFilter("all");
        void setVisiblityFilter("all");
        void setBrandIds([]);
        void table.resetRowSelection();
    };

    const copySelectedProductIds = async () => {
        if (selectedProducts.length === 0) return;

        try {
            await navigator.clipboard.writeText(
                selectedProducts.map((product) => product.id).join(", ")
            );
            toast.success(`Copied ${selectedProducts.length} product ID(s)`);
        } catch {
            toast.error("Failed to copy selected IDs");
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg border bg-card p-3">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
                    <Input
                        placeholder="Search by title or SKU..."
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
                            const nextValue =
                                value as
                                    | "all"
                                    | TableProduct["verificationStatus"];
                            table
                                .getColumn("verificationStatus")
                                ?.setFilterValue(
                                    nextValue === "all" ? undefined : nextValue
                                );
                            setVerificationStatus(
                                nextValue
                            );
                        }}
                    >
                        <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Search by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {["idle", "pending", "approved", "rejected"].map((x) => (
                                <SelectItem key={x} value={x}>
                                    {convertValueToLabel(x)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={productImage}
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
                        value={productVisiblity}
                        onValueChange={(value: VisiblityFilter) =>
                            setVisiblityFilter(value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Visibility" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                    </Select>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                                {brandIds.length > 0
                                    ? `${brandIds.length} brand(s) selected`
                                    : "Filter by brands"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-80 w-60 overflow-y-auto">
                            {brandIds.length > 0 && (
                                <>
                                    <DropdownMenuItem
                                        onSelect={(event) => {
                                            event.preventDefault();
                                            setBrandIds([]);
                                        }}
                                    >
                                        <Icons.X className="size-4" />
                                        Clear brand filter
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </>
                            )}

                            {brandsData?.data?.map((brand) => (
                                <DropdownMenuItem
                                    key={brand.id}
                                    asChild
                                    onSelect={(event) => event.preventDefault()}
                                >
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <Checkbox
                                            checked={brandIds.includes(brand.id)}
                                            onCheckedChange={(checked) => {
                                                const nextBrandIds = checked
                                                    ? [...brandIds, brand.id]
                                                    : brandIds.filter(
                                                          (id) => id !== brand.id
                                                      );
                                                void setBrandIds(nextBrandIds);
                                            }}
                                        />
                                        <span>{brand.name}</span>
                                    </label>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        onClick={clearAllFilters}
                        className="w-full xl:w-auto"
                    >
                        <Icons.ListRestart className="size-4" />
                        Clear all filters
                    </Button>
                </div>
            </div>

            {selectedProducts.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
                    <Badge variant="secondary">
                        {selectedProducts.length} selected
                    </Badge>
                    <Button variant="outline" size="sm" onClick={copySelectedProductIds}>
                        <Icons.Copy className="size-4" />
                        Copy selected IDs
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.resetRowSelection()}
                    >
                        <Icons.X className="size-4" />
                        Clear selection
                    </Button>
                </div>
            )}

            <div className="flex justify-end">
                <DataTableViewOptions table={table} />
            </div>

            <DataTable
                columns={columns as ColumnDef<TableProduct>[]}
                table={table}
                pages={pages}
                count={count}
            />
        </div>
    );
}
