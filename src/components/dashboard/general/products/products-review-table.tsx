"use client";

import { ProductAction as BrandProductAction } from "@/components/dashboard/brands/products/product-action";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { getTotalPages } from "@/components/ui/data-table-pagination-state";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-dash";
import { DialogHeader } from "@/components/ui/dialog-general";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    cn,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { CachedBrand, ProductWithBrand } from "@/lib/validations";
import { keepPreviousData } from "@tanstack/react-query";
import {
    ColumnDef,
    ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { buildAdminProductsQueryInput } from "./admin-products-query-state";
import { ProductAction } from "./product-admin-action";

export type TableProduct = ProductWithBrand & {
    stock: number;
    brandName: string;
    visibility: boolean;
    festivePosition?: number | null;
};

type ImageFilter = "with" | "without" | "all";
type VisiblityFilter = "private" | "public" | "all";
type QcFilter = "all" | "pass" | "warning" | "critical";
type SizeChartFilter = "with" | "without" | "all";
type VariantPriceFilter = "different" | "all";
type CatalogIssueFilter =
    | "all"
    | "oos_but_live"
    | "stale_inventory"
    | "claim_mismatch";

const STALE_INVENTORY_DAYS = 14;

const getColumns = (isBrandScoped: boolean): ColumnDef<TableProduct>[] => [
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
        header: () => <div className="min-w-[16rem] text-xs">Title</div>,
        enableHiding: false,
        cell: ({ row }) => (
            <div className="min-w-[16rem] max-w-[20rem] px-1 py-1">
                <p
                    className="line-clamp-2 break-words text-[13px] font-medium leading-snug text-slate-900"
                    title={row.original.title}
                >
                    {row.original.title}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "brandName",
        header: () => <span className="text-xs">Brand</span>,
        cell: ({ row }) => (
            <span className="text-[13px] text-slate-800">
                {row.original.brandName}
            </span>
        ),
    },
    {
        accessorKey: "festivePosition",
        header: () => <span className="text-xs">Festive Sequence</span>,
        cell: ({ row }) => (
            <span className="text-[13px] text-slate-800">
                {row.original.festivePosition ?? "—"}
            </span>
        ),
    },
    {
        accessorKey: "nativeSku",
        header: () => <span className="text-xs">Native SKU</span>,
        cell: ({ row }) => {
            const data = row.original;
            return (
                <span className="whitespace-nowrap font-mono text-[11px] text-slate-600">
                    {data.nativeSku || "N/A"}
                </span>
            );
        },
    },
    {
        accessorKey: "price",
        header: () => <span className="text-xs">Price</span>,
        cell: ({ row }) => {
            const data = row.original;

            if (!data.productHasVariants) {
                const price = formatPriceTag(
                    parseFloat(convertPaiseToRupees(data.price ?? 0)),
                    true
                );

                return (
                    <span className="whitespace-nowrap text-[13px] font-semibold text-slate-950">
                        {price}
                    </span>
                );
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

            if (minPriceRaw === maxPriceRaw) {
                return (
                    <span className="whitespace-nowrap text-[13px] font-semibold text-slate-950">
                        {minPrice}
                    </span>
                );
            }
            return (
                <span className="whitespace-nowrap text-[13px] font-semibold text-slate-950">
                    {minPrice} - {maxPrice}
                </span>
            );
        },
    },
    {
        accessorKey: "stock",
        header: () => <span className="text-xs">Stock</span>,
        cell: ({ row }) => (
            <span className="text-[13px]">{row.original.stock}</span>
        ),
    },
    {
        accessorKey: "category",
        header: () => <span className="text-xs">Category</span>,
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
        header: () => <span className="text-xs">Variants</span>,
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
        header: () => <span className="text-xs">Available</span>,
        cell: ({ row }) => {
            const data = row.original;
            return (
                <span className="text-[13px]">
                    {data.isAvailable ? "Yes" : "No"}
                </span>
            );
        },
    },
    {
        accessorKey: "verificationStatus",
        header: () => <span className="text-xs">Status</span>,
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
                    className="text-[11px] capitalize"
                >
                    {convertValueToLabel(data.verificationStatus)}
                </Badge>
            );
        },
    },
    {
        accessorKey: "qcStatus",
        header: () => <span className="text-xs">QC</span>,
        cell: ({ row }) => {
            const data = row.original;

            return (
                <Badge
                    variant={
                        data.qcStatus === "critical"
                            ? "destructive"
                            : data.qcStatus === "warning"
                              ? "default"
                              : "secondary"
                    }
                    className="text-[11px] capitalize"
                >
                    {convertValueToLabel(data.qcStatus)}
                </Badge>
            );
        },
    },
    {
        accessorKey: "visibility",
        header: () => <span className="text-xs">Visibility</span>,
        cell: ({ row }) => {
            const data = row.original;
            return (
                <Badge
                    variant={data.visibility ? "secondary" : "outline"}
                    className={cn(
                        "text-[11px]",
                        data.visibility
                            ? "bg-sky-100 text-sky-700 hover:bg-sky-100/90"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-100/90"
                    )}
                >
                    {data.visibility ? "Public" : "Private"}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: () => <span className="text-xs">Created At</span>,
        cell: ({ row }) => {
            const data = row.original;
            return (
                <span className="whitespace-nowrap text-[13px]">
                    {format(new Date(data.createdAt), "MMM dd, yyyy")}
                </span>
            );
        },
    },

    {
        id: "actions",
        enableHiding: false,
        header: () => <div className="text-right text-xs">Actions</div>,
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
                                        href={
                                            isBrandScoped
                                                ? `/dashboard/brands/${data.brandId}/products/p/${data.id}`
                                                : `/dashboard/general/products/preview-form/${data.id}`
                                        }
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

                    {isBrandScoped ? (
                        <BrandProductAction
                            product={{
                                ...data,
                                visibility: data.visibility ?? true,
                            }}
                        />
                    ) : (
                        <ProductAction
                            product={{
                                ...data,
                                visibility: data.visibility ?? true,
                            }}
                        />
                    )}
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
    brandId?: string;
}

export function ProductsReviewTable({ initialData, brandId }: PageProps) {
    const isBrandScoped = Boolean(brandId);
    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(1)
    );
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(15));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });
    const [searchDraft, setSearchDraft] = useState(search);
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
    const [qcStatusFilter, setQcStatusFilter] = useQueryState(
        "qcStatus",
        parseAsStringLiteral([
            "all",
            "pass",
            "warning",
            "critical",
        ] as const).withDefault("all")
    );
    const [catalogIssue, setCatalogIssue] = useQueryState(
        "catalogIssue",
        parseAsStringLiteral([
            "all",
            "oos_but_live",
            "stale_inventory",
            "claim_mismatch",
        ] as const).withDefault("all")
    );
    const [festiveFilter, setFestiveFilter] = useQueryState(
        "isFestiveProduct",
        parseAsStringLiteral(["all", "festive"] as const).withDefault("all")
    );
    const [categoryId, setCategoryId] = useQueryState(
        "categoryId",
        parseAsString.withDefault("all")
    );
    const [productTypeId, setProductTypeId] = useQueryState(
        "productTypeId",
        parseAsString.withDefault("all")
    );
    const [sizeChartFilter, setSizeChartFilter] = useQueryState(
        "sizeChartFilter",
        parseAsStringLiteral(["with", "without", "all"] as const).withDefault(
            "all"
        )
    );
    const [variantPriceFilter, setVariantPriceFilter] = useQueryState(
        "variantPriceFilter",
        parseAsStringLiteral(["different", "all"] as const).withDefault("all")
    );

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});
    const resetPage = useCallback(() => {
        if (page !== 1) void setPage(1);
    }, [page, setPage]);

    const commitSearch = useCallback(
        (value: string) => {
            const normalized = value.trim();
            if (normalized === search) return;
            resetPage();
            void setSearch(normalized);
        },
        [resetPage, search, setSearch]
    );

    useEffect(() => {
        setSearchDraft(search);
    }, [search]);

    useEffect(() => {
        const timeout = window.setTimeout(() => commitSearch(searchDraft), 300);
        return () => window.clearTimeout(timeout);
    }, [commitSearch, searchDraft]);

    const { data: brandsData } = trpc.general.brands.getBrands.useQuery(
        {
            page: 1,
            limit: 500,
        },
        {
            enabled: !isBrandScoped,
            staleTime: 5 * 60_000,
        }
    );
    const { data: categoriesData } =
        trpc.general.categories.getCategories.useQuery(undefined, {
            staleTime: 5 * 60_000,
        });
    const { data: productTypesData } =
        trpc.general.productTypes.getProductTypes.useQuery(undefined, {
            staleTime: 5 * 60_000,
        });
    const queryInitialData = useMemo(
        () => ({
            ...initialData,
            recommendationSource: null,
            topBrandMatch: null,
        }),
        [initialData]
    );
    const productsQueryInput = useMemo(
        () =>
            buildAdminProductsQueryInput({
                limit,
                page,
                search,
                verificationStatus,
                qcStatus: qcStatusFilter,
                catalogIssue,
                productImage,
                productVisiblity,
                isFestiveProduct: festiveFilter,
                categoryId,
                productTypeId,
                sizeChartFilter,
                variantPriceFilter,
                brandIds,
                scopedBrandId: brandId,
            }),
        [
            brandId,
            brandIds,
            catalogIssue,
            categoryId,
            festiveFilter,
            limit,
            page,
            productImage,
            productTypeId,
            productVisiblity,
            qcStatusFilter,
            search,
            sizeChartFilter,
            variantPriceFilter,
            verificationStatus,
        ]
    );

    const { data: queryData, isFetching } =
        trpc.brands.products.getProducts.useQuery(productsQueryInput, {
            placeholderData: (previousData) => previousData ?? queryInitialData,
            staleTime: 15_000,
        });
    const { data: qcSummary } =
        trpc.brands.products.getCatalogQcSummary.useQuery(
            {
                search: search || undefined,
                brandIds: isBrandScoped
                    ? [brandId ?? ""]
                    : brandIds.length > 0
                      ? brandIds
                      : undefined,
                verificationStatus:
                    verificationStatus === "all"
                        ? undefined
                        : verificationStatus,
                qcStatus: qcStatusFilter === "all" ? undefined : qcStatusFilter,
                catalogIssue: catalogIssue === "all" ? undefined : catalogIssue,
                categoryId: categoryId === "all" ? undefined : categoryId,
                productTypeId:
                    productTypeId === "all" ? undefined : productTypeId,
                sizeChartFilter:
                    sizeChartFilter === "all" ? undefined : sizeChartFilter,
                variantPriceFilter:
                    variantPriceFilter === "all"
                        ? undefined
                        : variantPriceFilter,
                productImage: productImage === "all" ? undefined : productImage,
                productVisiblity:
                    productVisiblity === "all" ? undefined : productVisiblity,
            },
            {
                staleTime: 30_000,
                placeholderData: keepPreviousData,
            }
        );
    const count = queryData?.count ?? 0;

    const data = useMemo(
        () =>
            (queryData?.data ?? []).map((x) => ({
                ...x,
                stock: x.productHasVariants
                    ? x.variants.reduce((acc, curr) => acc + curr.quantity, 0)
                    : (x.quantity ?? 0),
                brandName: x.brand.name,
                visibility: x.isPublished,
            })),
        [queryData?.data]
    );

    const visibleSummary = useMemo(() => {
        const now = Date.now();
        const avgQcScore =
            data.length > 0
                ? Math.round(
                      data.reduce(
                          (sum, product) => sum + (product.qcScore ?? 0),
                          0
                      ) / data.length
                  )
                : 0;

        return {
            avgQcScore,
            criticalCount: data.filter(
                (product) => product.qcStatus === "critical"
            ).length,
            warningCount: data.filter(
                (product) => product.qcStatus === "warning"
            ).length,
            oosAvailableCount: data.filter(
                (product) => product.isAvailable && product.stock <= 0
            ).length,
            staleInventoryCount: data.filter((product) => {
                const reference =
                    product.inventoryLastSyncedAt ?? product.updatedAt;
                if (!reference) return false;
                const ageDays = Math.floor(
                    (now - new Date(reference).getTime()) /
                        (1000 * 60 * 60 * 24)
                );
                return ageDays >= STALE_INVENTORY_DAYS;
            }).length,
            claimMismatchCount: data.filter((product) =>
                (product.qcFindings ?? []).some((finding) =>
                    [
                        "claim_scope_mismatch",
                        "claim_without_brand_scope",
                    ].includes(finding.code)
                )
            ).length,
        };
    }, [data]);

    const summary = qcSummary
        ? {
              avgQcScore: qcSummary.avgQcScore,
              criticalCount: qcSummary.criticalCount,
              warningCount: qcSummary.warningCount,
              oosAvailableCount: qcSummary.oosAvailableCount,
              staleInventoryCount: qcSummary.staleInventoryCount,
              claimMismatchCount: qcSummary.claimMismatchCount,
          }
        : visibleSummary;
    const activeFilterCount = [
        Boolean(search),
        verificationStatus !== "all",
        qcStatusFilter !== "all",
        catalogIssue !== "all",
        productImage !== "all",
        productVisiblity !== "all",
        festiveFilter !== "all",
        categoryId !== "all",
        productTypeId !== "all",
        sizeChartFilter !== "all",
        variantPriceFilter !== "all",
        !isBrandScoped && brandIds.length > 0,
    ].filter(Boolean).length;

    const pages = useMemo(() => getTotalPages(count, limit), [count, limit]);
    const tableColumns = useMemo(
        () => getColumns(isBrandScoped),
        [isBrandScoped]
    );

    const table = useReactTable({
        data,
        columns: tableColumns,
        pageCount: pages,
        manualPagination: true,
        getCoreRowModel: getCoreRowModel(),
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
            pagination: {
                pageIndex: Math.max(page - 1, 0),
                pageSize: limit,
            },
        },
    });

    const selectedProducts = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);

    useEffect(() => {
        if (!isFetching && page > pages) void setPage(pages);
    }, [isFetching, page, pages, setPage]);

    const clearAllFilters = () => {
        table.resetColumnFilters();
        void setSearch("");
        void setVerificationStatus("all");
        void setQcStatusFilter("all");
        void setCatalogIssue("all");
        void setImageFilter("all");
        void setVisiblityFilter("all");
        void setFestiveFilter("all");
        void setCategoryId("all");
        void setProductTypeId("all");
        void setSizeChartFilter("all");
        void setVariantPriceFilter("all");
        if (!isBrandScoped) void setBrandIds([]);
        void setPage(1);
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
        <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-3 border-b border-slate-200 bg-slate-50/60 p-4 md:grid-cols-2 xl:grid-cols-6">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Avg QC Score
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                        {summary.avgQcScore}
                    </p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50/80 p-3">
                    <p className="text-xs uppercase tracking-wide text-red-700">
                        Critical
                    </p>
                    <p className="mt-1 text-xl font-semibold text-red-800">
                        {summary.criticalCount}
                    </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3">
                    <p className="text-xs uppercase tracking-wide text-amber-700">
                        Warnings
                    </p>
                    <p className="mt-1 text-xl font-semibold text-amber-800">
                        {summary.warningCount}
                    </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        OOS But Live
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                        {summary.oosAvailableCount}
                    </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Stale Inventory
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                        {summary.staleInventoryCount}
                    </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Claim Mismatch
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                        {summary.claimMismatchCount}
                    </p>
                </div>
            </div>
            <div className="border-b border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Find and filter products
                        </h2>
                        {activeFilterCount > 0 ? (
                            <Badge variant="secondary">
                                {activeFilterCount} active
                            </Badge>
                        ) : null}
                    </div>
                    <span
                        className={cn(
                            "text-xs text-muted-foreground transition-opacity",
                            isFetching ? "opacity-100" : "opacity-0"
                        )}
                        role="status"
                        aria-live="polite"
                    >
                        Updating results…
                    </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
                    <Input
                        placeholder="Search by title or SKU..."
                        className="bg-white sm:col-span-2"
                        value={searchDraft}
                        onChange={(event) => setSearchDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                commitSearch(searchDraft);
                            }
                        }}
                        aria-label="Search products by title or SKU"
                    />

                    <Select
                        value={verificationStatus}
                        onValueChange={(value) => {
                            const nextValue = value as
                                | "all"
                                | TableProduct["verificationStatus"];
                            resetPage();
                            void setVerificationStatus(nextValue);
                        }}
                    >
                        <SelectTrigger className="bg-white capitalize">
                            <SelectValue placeholder="Search by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {["idle", "pending", "approved", "rejected"].map(
                                (x) => (
                                    <SelectItem key={x} value={x}>
                                        {convertValueToLabel(x)}
                                    </SelectItem>
                                )
                            )}
                        </SelectContent>
                    </Select>
                    <Select
                        value={productImage}
                        onValueChange={(value: ImageFilter) => {
                            resetPage();
                            void setImageFilter(value);
                        }}
                    >
                        <SelectTrigger className="bg-white">
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
                        value={qcStatusFilter}
                        onValueChange={(value: QcFilter) => {
                            resetPage();
                            void setQcStatusFilter(value);
                        }}
                    >
                        <SelectTrigger className="bg-white capitalize">
                            <SelectValue placeholder="Filter by QC" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All QC</SelectItem>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={catalogIssue}
                        onValueChange={(value: CatalogIssueFilter) => {
                            resetPage();
                            void setCatalogIssue(value);
                        }}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Filter by catalogue issue" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                All catalogue health
                            </SelectItem>
                            <SelectItem value="oos_but_live">
                                Out of stock but live
                            </SelectItem>
                            <SelectItem value="stale_inventory">
                                Stale inventory
                            </SelectItem>
                            <SelectItem value="claim_mismatch">
                                Claim mismatch
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={productVisiblity}
                        onValueChange={(value: VisiblityFilter) => {
                            resetPage();
                            void setVisiblityFilter(value);
                        }}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Filter by Visibility" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={festiveFilter}
                        onValueChange={(value: "all" | "festive") => {
                            resetPage();
                            void setFestiveFilter(value);
                        }}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Filter by Festive" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="festive">
                                Festive Products
                            </SelectItem>
                            <SelectItem value="all">All Products</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={categoryId}
                        onValueChange={(value) => {
                            resetPage();
                            void setCategoryId(value);
                        }}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Filter by Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categoriesData?.data.map((category) => (
                                <SelectItem
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={productTypeId}
                        onValueChange={(value) => {
                            resetPage();
                            void setProductTypeId(value);
                        }}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Filter by Product Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                All Product Types
                            </SelectItem>
                            {productTypesData?.data.map((productType) => (
                                <SelectItem
                                    key={productType.id}
                                    value={productType.id}
                                >
                                    {productType.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={sizeChartFilter}
                        onValueChange={(value: SizeChartFilter) => {
                            resetPage();
                            void setSizeChartFilter(value);
                        }}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Filter by Size Chart" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="with">
                                With Size Chart
                            </SelectItem>
                            <SelectItem value="without">
                                Without Size Chart
                            </SelectItem>
                            <SelectItem value="all">All Products</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={variantPriceFilter}
                        onValueChange={(value: VariantPriceFilter) => {
                            resetPage();
                            void setVariantPriceFilter(value);
                        }}
                    >
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Filter by Variant Price" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="different">
                                Different Variant Prices
                            </SelectItem>
                            <SelectItem value="all">
                                All Variant Prices
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    {!isBrandScoped && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start bg-white"
                                >
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
                                                resetPage();
                                                void setBrandIds([]);
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
                                        onSelect={(event) =>
                                            event.preventDefault()
                                        }
                                    >
                                        <label className="flex cursor-pointer items-center gap-2">
                                            <Checkbox
                                                checked={brandIds.includes(
                                                    brand.id
                                                )}
                                                onCheckedChange={(checked) => {
                                                    const nextBrandIds = checked
                                                        ? [
                                                              ...brandIds,
                                                              brand.id,
                                                          ]
                                                        : brandIds.filter(
                                                              (id) =>
                                                                  id !==
                                                                  brand.id
                                                          );
                                                    resetPage();
                                                    void setBrandIds(
                                                        nextBrandIds
                                                    );
                                                }}
                                            />
                                            <span>{brand.name}</span>
                                        </label>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    <Button
                        variant="outline"
                        onClick={clearAllFilters}
                        className="w-full bg-white"
                    >
                        <Icons.ListRestart className="size-4" />
                        Clear all filters
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-9">
                    {selectedProducts.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                                {selectedProducts.length} selected
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copySelectedProductIds}
                            >
                                <Icons.Copy className="size-4" />
                                Copy IDs
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.resetRowSelection()}
                            >
                                <Icons.X className="size-4" />
                                Clear
                            </Button>
                        </div>
                    ) : (
                        <p className="flex h-9 items-center text-sm text-muted-foreground">
                            {count} product{count === 1 ? "" : "s"} found
                        </p>
                    )}
                </div>

                <DataTableViewOptions table={table} />
            </div>

            <DataTable
                columns={tableColumns}
                table={table}
                pages={pages}
                count={count}
                isLoading={isFetching}
                tableContainerClassName="max-h-[70vh] overscroll-contain"
            />
        </div>
    );
}
