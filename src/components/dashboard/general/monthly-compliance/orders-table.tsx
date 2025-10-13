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
import * as XLSX from "xlsx";

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
const [applyShipmentFlag, setApplyShipmentFlag] = useState(false);

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
            refetchOnMount: true,
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

    const handleExport = async () => {
        // Fetch selected rows or all filtered data
        let dataToUse = table.getSelectedRowModel().rows.map((row) => row.original);
        if (dataToUse.length === 0) {
            const { data: allData } = await refetchOrderData({
                    page: 1,
                    limit: count,
                    search,
                    brandIds: brandIds.length > 0 ? brandIds : undefined,
                    startDate: startDate ? format(startDate, "yyyy-MM-dd") : format(defaultStartDate, "yyyy-MM-dd"),
                    endDate: endDate ? format(endDate, "yyyy-MM-dd") : format(defaultEndDate, "yyyy-MM-dd"),
            });
            dataToUse = allData?.data ?? [];
        }
// Prepare data for Excel export
// Prepare data for Excel export
const exportData = dataToUse.flatMap((order) =>
    order.items.map((item) => {
        const grossSale = Number(convertPaiseToRupees(order.totalAmount));
        let commissionRate = item.product.category?.commissionRate || 0;
        // Apply 5% adjustment if flag is set
        if (applyShipmentFlag) {
            commissionRate += 5; // Increase commission by 5%
        }
        const commissionAmount = (commissionRate / 100) * grossSale;
        const gstOnCommission = (18 / 100) * commissionAmount;
        const netTaxableValue = grossSale * 0.82; // Assuming 18% GST included
        const gstCollected = grossSale - netTaxableValue;
        const tcs = (1 / 100) * netTaxableValue;
        const shippingFee = applyShipmentFlag
            ? 0
            : order.shipments?.[0]?.awbDetailsShipRocketJson?.response?.data?.freight_charges || 0;
        const paymentGatewayFee = order.totalAmount * 0.02 > 2000 ? order.totalAmount * 0.02 : 2000;
// console.log(order.items, "order");
        return {
            "Order ID": order.id,
            "Order Date": format(new Date(order.createdAt), "yyyy-MM-dd"),
            "Product SKU": item.product.sku || "N/A",
            "Product Name": item.product.title || "N/A",
            "Customer State": order.address?.state || "N/A",
            "Customer Zip": order.address?.zip || "N/A",
            "Gross Sale (Incl. GST)": formatPriceTag(grossSale, true),
            "Net Taxable Value": formatPriceTag(netTaxableValue, true),
            "GST Collected (18%)": formatPriceTag(gstCollected, true),
            "Commission %": `${commissionRate}%`,
            "Commission Amount": formatPriceTag(commissionAmount, true),
            "GST on Commission @18%": formatPriceTag(gstOnCommission, true),
            "TCS @1% on Net Taxable Value": formatPriceTag(tcs, true),
            "Shipping Fee (if charged separately)": formatPriceTag(shippingFee),
            "Payment Gateway Fee": formatPriceTag(Number(convertPaiseToRupees(paymentGatewayFee)), true),
        };
    })
);
        // Create Excel file
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Order Details");
        XLSX.writeFile(wb, `order-details-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
        {/* Filter & Actions Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Filters Group */}
            <div className="flex flex-wrap items-center gap-6">
                {/* Search Input */}
                <div className="min-w-[260px]">
                    <Label htmlFor="search" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Search Orders
                    </Label>
                    <Input
                        id="search"
                        placeholder="Search by order ID..."
                        className="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        value={search}
                        onChange={(e) => {
                            table.getColumn("id")?.setFilterValue(e.target.value);
                            setSearch(e.target.value);
                        }}
                    />
                </div>
                {/* Date Range */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-[180px]">
                            <Label htmlFor="start-date" className="text-sm font-semibold text-gray-700 mb-2 block">
                                Start Date
                            </Label>
                            <Input
                                id="start-date"
                                type="date"
                                className="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                value={startDate ? format(startDate, "yyyy-MM-dd") : format(defaultStartDate, "yyyy-MM-dd")}
                                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : defaultStartDate)}
                            />
                        </div>
                        <span className="text-gray-500 font-medium hidden sm:block">–</span>
                    </div>
                    <div className="w-[180px]">
                        <Label htmlFor="end-date" className="text-sm font-semibold text-gray-700 mb-2 block">
                            End Date
                        </Label>
                        <Input
                            id="end-date"
                            type="date"
                            className="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            value={endDate ? format(endDate, "yyyy-MM-dd") : format(defaultEndDate, "yyyy-MM-dd")}
                            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : defaultEndDate)}
                        />
                    </div>
                </div>
                {/* Brand Filter */}
                <div className="min-w-[260px]">
                    <Label htmlFor="brand-filter" className="text-sm font-semibold text-gray-700 mb-2 block">
                        Brand Filter
                    </Label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-between rounded-md border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition"
                            >
                                {brandIds.length > 0
                                    ? `${brandIds.length} brand(s) selected`
                                    : "Select brands"}
                                <ChevronDown className="ml-2 h-5 w-5 text-gray-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-[320px] w-[260px] overflow-y-auto bg-white rounded-md shadow-lg border border-gray-200">
                            {brandsData?.data?.map((brand) => (
                                <DropdownMenuItem
                                    key={brand.id}
                                    onSelect={(e) => e.preventDefault()}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100"
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
                                        className="border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-800">{brand.name}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {/* Shipment Adjustment Checkbox */}
                <div className="flex items-center pt-5 gap-3">
                    <Checkbox
                        id="shipment-flag"
                        checked={applyShipmentFlag}
                        onCheckedChange={(checked) => setApplyShipmentFlag(Boolean(checked))}
                        className="border-gray-300 focus:ring-blue-500"
                    />
                    <Label htmlFor="shipment-flag" className="text-sm font-semibold text-gray-700">
                        Apply 5% Shipment Adjustment
                    </Label>
                </div>
                                    <div className="flex items-center pt-5 gap-3">
     <Button
                    onClick={handleExport}
                    className="text-white rounded-md px-6 py-2 font-semibold transition"
                >
                    Download Compliance Report
                </Button>
                </div>
            </div>



        </div>

        {/* Table Section */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
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