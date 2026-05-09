"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { Order } from "@/lib/validations";
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
import { PackageCheck, Search, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { OrderAction } from "./order-action";

export type TableOrder = Order;

const volumetricWeightGrams = (length: number, width: number, height: number) =>
    Math.round((length * width * height) / 5);

const getOrderStatusClassName = (status: TableOrder["status"]) =>
    ({
        pending: "border-amber-200 bg-amber-50 text-amber-700",
        processing: "border-sky-200 bg-sky-50 text-sky-700",
        shipped: "border-indigo-200 bg-indigo-50 text-indigo-700",
        delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
        cancelled: "border-rose-200 bg-rose-50 text-rose-700",
    })[status] ?? "border-slate-200 bg-slate-50 text-slate-700";

const getPaymentStatusClassName = (status: TableOrder["paymentStatus"]) =>
    ({
        pending: "border-amber-200 bg-amber-50 text-amber-700",
        paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
        failed: "border-rose-200 bg-rose-50 text-rose-700",
        refund_pending: "border-orange-200 bg-orange-50 text-orange-700",
        refunded: "border-teal-200 bg-teal-50 text-teal-700",
        refund_failed: "border-rose-200 bg-rose-50 text-rose-700",
    })[status] ?? "border-slate-200 bg-slate-50 text-slate-700";

const formatOrderDate = (date: TableOrder["createdAt"]) =>
    format(new Date(date), "dd MMM yyyy, h:mm a");

function DimensionEditModal({
    open,
    onClose,
    order,
}: {
    open: boolean;
    onClose: () => void;
    order: TableOrder;
}) {
    const utils = trpc.useUtils();

    const updateDimensions =
        trpc.general.orders.updateDelhiveryDimensions.useMutation({
            onSuccess: () => {
                utils.brands.orders.getOrdersByBrandId.invalidate();
                onClose();
            },
        });

    const [length, setLength] = useState(
        order.givenLength !== null && order.givenLength !== undefined
            ? String(order.givenLength)
            : ""
    );
    const [width, setWidth] = useState(
        order.givenWidth !== null && order.givenWidth !== undefined
            ? String(order.givenWidth)
            : ""
    );
    const [height, setHeight] = useState(
        order.givenHeight !== null && order.givenHeight !== undefined
            ? String(order.givenHeight)
            : ""
    );

    const l = Number(length);
    const w = Number(width);
    const h = Number(height);
    const volWeight =
        l > 0 && w > 0 && h > 0 ? volumetricWeightGrams(l, w, h) : 0;

    const handleSave = () => {
        if (!order.awbNumber) return;

        updateDimensions.mutate({
            orderId: order.id,
            awbNumber: order.awbNumber,
            length: l,
            width: w,
            height: h,
            volumetricWeight: volWeight,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Package Dimensions</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">
                            Length (cm)
                        </label>
                        <Input
                            value={length}
                            onChange={(event) => setLength(event.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">
                            Width (cm)
                        </label>
                        <Input
                            value={width}
                            onChange={(event) => setWidth(event.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium">
                            Height (cm)
                        </label>
                        <Input
                            value={height}
                            onChange={(event) => setHeight(event.target.value)}
                        />
                    </div>

                    <div className="text-sm text-muted-foreground">
                        Volumetric Weight:{" "}
                        <span className="font-semibold text-foreground">
                            {volWeight} g
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={
                            updateDimensions.isLoading ||
                            !l ||
                            !w ||
                            !h ||
                            !order.awbNumber
                        }
                    >
                        {updateDimensions.isLoading ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const columns = (
    onAction: () => void,
    onEdit: (order: TableOrder) => void,
    pathname: string
): ColumnDef<TableOrder>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all orders"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={`Select order ${row.original.id}`}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: "Order Details",
        enableHiding: false,
        cell: ({ row }) => {
            const data = row.original;

            return (
                <div className="min-w-[210px] space-y-1.5">
                    <Link
                        className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                        href={`${pathname}/${data.id}`}
                    >
                        #{data.id}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                        {formatOrderDate(data.createdAt)}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                            variant="outline"
                            className="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-600"
                        >
                            {data.totalItems} item
                            {data.totalItems === 1 ? "" : "s"}
                        </Badge>
                        {data.paymentMethod && (
                            <Badge
                                variant="outline"
                                className="rounded-md border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-600"
                            >
                                {convertValueToLabel(data.paymentMethod)}
                            </Badge>
                        )}
                    </div>
                </div>
            );
        },
    },
    {
        id: "customer",
        header: "Customer",
        cell: ({ row }) => {
            const data = row.original;
            const customerName = [data.firstName, data.lastName]
                .filter(Boolean)
                .join(" ");

            return (
                <div className="min-w-[180px] space-y-1">
                    <div className="font-medium text-slate-900">
                        {customerName || "Unknown customer"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {data.phone || "No phone"}
                    </div>
                    <div className="max-w-[180px] truncate text-xs text-muted-foreground">
                        {[data.city, data.state, data.zip]
                            .filter(Boolean)
                            .join(", ") || "No address"}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "totalAmount",
        header: "Payment",
        cell: ({ row }) => {
            const data = row.original;

            return (
                <div className="min-w-[120px] space-y-1.5">
                    <div className="font-semibold text-slate-950">
                        {formatPriceTag(
                            +convertPaiseToRupees(data.totalAmount),
                            true
                        )}
                    </div>
                    <Badge
                        variant="outline"
                        className={cn(
                            "rounded-md px-2 py-0.5 font-medium",
                            getPaymentStatusClassName(data.paymentStatus)
                        )}
                    >
                        {convertValueToLabel(data.paymentStatus)}
                    </Badge>
                </div>
            );
        },
    },
    {
        id: "shipment",
        header: "Shipment",
        cell: ({ row }) => {
            const data = row.original;
            const awb = data.awbNumber || data.uploadWbn;
            const shipmentId = data.shiprocketShipmentId ?? data.shiprocketOrderId;

            return (
                <div className="min-w-[190px] space-y-1.5">
                    <div className="flex items-center gap-2 font-medium text-slate-900">
                        <Truck className="size-4 text-sky-600" />
                        {data.courierName || "Courier pending"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        AWB:{" "}
                        <span className="font-medium text-slate-700">
                            {awb || "Not generated"}
                        </span>
                    </div>
                    {shipmentId && (
                        <div className="text-xs text-muted-foreground">
                            Shipment: {shipmentId}
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        id: "dimensions",
        header: "Package",
        cell: ({ row }) => {
            const order = row.original;
            const length = order.givenLength ?? 0;
            const width = order.givenWidth ?? 0;
            const height = order.givenHeight ?? 0;
            const vol = volumetricWeightGrams(length, width, height);
            const canEdit =
                order.status !== "cancelled" &&
                order.status !== "shipped" &&
                order.status !== "delivered";

            return (
                <div className="min-w-[150px] space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-900">
                        <PackageCheck className="size-4 text-emerald-600" />
                        {`${length} x ${width} x ${height} cm`}
                    </div>
                    <div className="text-muted-foreground">
                        Vol. weight: {vol} g
                    </div>
                    {canEdit && (
                        <button
                            className="font-medium text-sky-700 underline-offset-4 hover:underline"
                            onClick={() => onEdit(order)}
                        >
                            Edit package
                        </button>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Badge
                variant="outline"
                className={cn(
                    "rounded-md px-2.5 py-1 font-semibold",
                    getOrderStatusClassName(row.original.status)
                )}
            >
                {convertValueToLabel(row.original.status)}
            </Badge>
        ),
    },
    {
        id: "actions",
        header: "",
        cell: ({ row }) => (
            <OrderAction order={row.original} onAction={onAction} />
        ),
    },
];

interface PageProps {
    initialData: Order[];
    brandId: string;
    totalCount: number;
    shipmentStatus?: string;
    isRto?: boolean;
}

export function OrdersTable({
    initialData,
    brandId,
    totalCount,
    shipmentStatus,
    isRto,
}: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [selectedOrder, setSelectedOrder] = useState<TableOrder | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});
    const pathname = usePathname();

    const { data, refetch } = trpc.brands.orders.getOrdersByBrandId.useQuery(
        { brandId, page, limit, shipmentStatus, isRto },
        { initialData: { data: initialData, total: totalCount } }
    );

    const tableData = useMemo(() => data?.data ?? [], [data?.data]);
    const count = data?.total ?? 0;
    const pages = useMemo(() => Math.ceil(count / limit) || 1, [count, limit]);
    const tableColumns = useMemo(
        () => columns(refetch, setSelectedOrder, pathname),
        [refetch, pathname]
    );
    const pageStats = useMemo(
        () => ({
            newOrders: tableData.filter((order) => order.status === "pending")
                .length,
            inTransit: tableData.filter((order) => order.status === "shipped")
                .length,
            delivered: tableData.filter((order) => order.status === "delivered")
                .length,
            awbPending: tableData.filter(
                (order) => !order.awbNumber && !order.uploadWbn
            ).length,
        }),
        [tableData]
    );

    const table = useReactTable({
        data: tableData,
        columns: tableColumns,
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
                pageSize: limit,
            },
        },
    });

    return (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ["New", pageStats.newOrders],
                        ["In Transit", pageStats.inTransit],
                        ["Delivered", pageStats.delivered],
                        ["AWB Pending", pageStats.awbPending],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="min-w-32 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                            <div className="text-xs font-medium text-muted-foreground">
                                {label}
                            </div>
                            <div className="text-lg font-semibold text-slate-950">
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 sm:w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search order ID"
                            value={
                                (table
                                    .getColumn("id")
                                    ?.getFilterValue() as string) ?? ""
                            }
                            onChange={(event) =>
                                table
                                    .getColumn("id")
                                    ?.setFilterValue(event.target.value)
                            }
                            className="pl-9"
                        />
                    </div>
                    <DataTableViewOptions table={table} />
                </div>
            </div>

            <DataTable
                columns={tableColumns}
                table={table}
                pages={pages}
                count={count}
            />

            {selectedOrder && (
                <DimensionEditModal
                    open
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
}
