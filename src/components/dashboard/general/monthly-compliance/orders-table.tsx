"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table-order";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import {
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { OrderWithItemAndBrand } from "@/lib/validations";
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
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useMemo, useState, useEffect } from "react";
import { OrderAction } from "./order-action";
import { OrderSingle } from "./order-single";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
    parseAsInteger,
    parseAsString,
    parseAsArrayOf,
    parseAsIsoDate,
    useQueryState,

} from "nuqs";
import { Button } from "@/components/ui/button-dash";
import { CachedBrand } from "@/lib/validations";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";

export type TableOrder = OrderWithItemAndBrand;

const columns = (onAction: () => void): ColumnDef<TableOrder>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <input
                type="checkbox"
                checked={table.getIsAllPageRowsSelected()}
                onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
                className="cursor-pointer"
            />
        ),
        cell: ({ row }) => (
            <input
                type="checkbox"
                checked={row.getIsSelected()}
                onChange={(e) => row.toggleSelected(e.target.checked)}
                className="cursor-pointer"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: "Order ID",
        enableHiding: false,
        cell: ({ row }) => {
            const data = row.original;
            return <OrderSingle order={data} />;
        },
    },
    {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => {
            const data = row.original;
            return formatPriceTag(
                +convertPaiseToRupees(data.totalAmount),
                true
            );
        },
    },
    {
        accessorKey: "totalItems",
        header: "Total Items",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const data = row.original;
            return <Badge>{convertValueToLabel(data.status)}</Badge>;
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
            return <OrderAction order={data} onAction={onAction} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: OrderWithItemAndBrand[];
        count: number;
    };
    brandData?: {
        data: CachedBrand[];
        count: number;
    };
}

export function OrdersTable({ initialData, brandData }: PageProps) {
    // Set default dates to current month
    const currentDate = new Date();
    const defaultStartDate = startOfMonth(currentDate);
    const defaultEndDate = endOfMonth(currentDate);

    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });
    const [brandFilter, setBrandFilter] = useQueryState(
        "brand",
        parseAsString.withDefault("all")
    );
    const [brandIds, setBrandIds] = useQueryState(
        "brandIds",
        parseAsArrayOf(parseAsString).withDefault([])
    );
    const [perPage, setPerPage] = useQueryState("perPage", parseAsInteger.withDefault(10));
    const [startDate, setStartDate] = useQueryState(
        "startDate",
        parseAsIsoDate.withDefault(defaultStartDate)
    );
    const [endDate, setEndDate] = useQueryState(
        "endDate",
        parseAsIsoDate.withDefault(defaultEndDate)
    );
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // Ensure default dates are set on initial load
    useEffect(() => {
        if (!startDate) {
            setStartDate(defaultStartDate);
        }
        if (!endDate) {
            setEndDate(defaultEndDate);
        }
    }, [startDate, endDate, setStartDate, setEndDate]);

    const { data: { data: dataRaw, count }, refetch: refetchOrderData, isLoading } = trpc.general.orders.getOrders.useQuery(
        {
            page,
            limit: perPage,
            search,
            brandIds: brandIds.length > 0 ? brandIds : undefined,
            startDate: startDate ? format(startDate, "yyyy-MM-dd") : format(defaultStartDate, "yyyy-MM-dd"),
            endDate: endDate ? format(endDate, "yyyy-MM-dd") : format(defaultEndDate, "yyyy-MM-dd"),
        },
        {
            initialData,
            keepPreviousData: true,
            refetchOnWindowFocus: false,
            refetchOnMount: true, // Changed to true to ensure fresh data on mount
            refetchOnReconnect: false,
        }
    );

    const { data: brandsData } = trpc.general.brands.getBrands.useQuery(
        {
            page: 1,
            limit: 150,
            search,
        },
        {
            initialData: brandData,
        }
    );

    const data = useMemo(() => dataRaw.map((x) => x), [dataRaw]);
    const isBrandSelected = brandIds.length > 0;
    const pages = useMemo(() => Math.ceil(count / perPage) ?? 1, [count, perPage]);

    const table = useReactTable({
        data,
        columns: columns(refetchOrderData),
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        pageCount: pages,
        manualPagination: true,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex: page - 1,
                pageSize: perPage,
            },
        },
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 space-y-6">
            {/* Filter & Actions Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                {/* Filters Group */}
                <div className="flex flex-wrap items-end gap-4">
                    {/* Search Input */}
                    <div className="min-w-[240px]">
                        <Input
                            placeholder="Search by order ID..."
                            className="w-full"
                            value={search}
                            onChange={(e) => {
                                table.getColumn("id")?.setFilterValue(e.target.value);
                                setSearch(e.target.value);
                            }}
                        />
                    </div>
                    {/* Date Range */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-[160px]">
                                <Label htmlFor="start-date" className="text-sm font-medium text-gray-600">
                                    Start Date
                                </Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    className="w-full mt-1"
                                    value={startDate ? format(startDate, "yyyy-MM-dd") : format(defaultStartDate, "yyyy-MM-dd")}
                                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : defaultStartDate)}
                                />
                            </div>
                            <span className="text-gray-400 mb-1 hidden sm:block">-</span>
                        </div>
                        <div className="w-[160px]">
                            <Label htmlFor="end-date" className="text-sm font-medium text-gray-600">
                                End Date
                            </Label>
                            <Input
                                id="end-date"
                                type="date"
                                className="w-full mt-1"
                                value={endDate ? format(endDate, "yyyy-MM-dd") : format(defaultEndDate, "yyyy-MM-dd")}
                                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : defaultEndDate)}
                            />
                        </div>
                    </div>
                    {/* Brand Filter */}
                    <div className="min-w-[240px]">
                        <div className="text-sm font-medium text-gray-600 mb-1 block">
                            Brand Filter
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    {brandIds.length > 0
                                        ? `${brandIds.length} brand(s) selected`
                                        : "Select brands"}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="max-h-[280px] w-[240px] overflow-y-auto">
                                {brandsData?.data?.map((brand) => (
                                    <DropdownMenuItem
                                        key={brand.id}
                                        onSelect={(e) => e.preventDefault()}
                                        className="flex items-center gap-3"
                                    >
                                        <Checkbox
                                            checked={brandIds.includes(brand.id)}
                                            onCheckedChange={(checked) => {
                                                const updated = checked
                                                    ? [...brandIds, brand.id]
                                                    : brandIds.filter((id) => id !== brand.id);
                                                setBrandIds(updated);
                                                if (updated.length > 0) setBrandFilter("all");
                                            }}
                                        />
                                        <span className="text-sm">{brand.name}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Actions Group */}
                <div className="flex flex-wrap gap-3">
                    <DataTableViewOptions table={table} />
                </div>
            </div>

            {/* Table Section */}
            <div className="border rounded-lg overflow-hidden">
                <DataTable
                    columns={columns(refetchOrderData)}
                    table={table}
                    pages={pages}
                    count={count}
                    perPage={perPage}
                    onPerPageChange={(value) => {
                        setPerPage(value);
                        setPage(1);
                    }}
                />
            </div>
        </div>
    );
}