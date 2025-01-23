"use client";

import { Badge } from "@/components/ui/badge";
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
import {
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { CouponWithCategory } from "@/lib/validations";
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
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CouponAction } from "./coupon-action";

export type TableCoupon = CouponWithCategory & {
    categoryName: string | null;
    subCategoryName: string | null;
    productTypeName: string | null;
    status: string;
};

const columns: ColumnDef<TableCoupon>[] = [
    {
        accessorKey: "code",
        header: "Code",
        enableHiding: false,
        cell: ({ row }) => {
            const data = row.original;
            return (
                <button
                    className="hover:underline"
                    onClick={() => {
                        navigator.clipboard.writeText(data.code);
                        toast.success("Code copied to clipboard");
                    }}
                >
                    {data.code}
                </button>
            );
        },
    },
    {
        accessorKey: "maxUses",
        header: "Max Uses",
        cell: ({ row }) => {
            const data = row.original;
            return data.maxUses === 0 ? "∞" : data.maxUses;
        },
    },
    {
        accessorKey: "uses",
        header: "Uses",
    },
    {
        accessorKey: "expiresAt",
        header: "Expires At",
        cell: ({ row }) => {
            const data = row.original;
            return data.expiresAt
                ? format(new Date(data.expiresAt), "MMM dd, yyyy")
                : "∞";
        },
    },
    {
        accessorKey: "categoryName",
        header: "Category",
        cell: ({ row }) => {
            const data = row.original;
            return data.categoryName ?? "All";
        },
    },
    {
        accessorKey: "subCategoryName",
        header: "Sub Category",
        cell: ({ row }) => {
            const data = row.original;
            return data.subCategoryName ?? "All";
        },
    },
    {
        accessorKey: "productTypeName",
        header: "Product Type",
        cell: ({ row }) => {
            const data = row.original;
            return data.productTypeName ?? "All";
        },
    },
    {
        accessorKey: "discountType",
        header: "Discount Type",
        cell: ({ row }) => {
            const data = row.original;
            return convertValueToLabel(data.discountType);
        },
    },
    {
        accessorKey: "discountValue",
        header: "Discount Value",
        cell: ({ row }) => {
            const data = row.original;
            return data.discountType === "percentage"
                ? `${data.discountValue}%`
                : formatPriceTag(+convertPaiseToRupees(data.discountValue));
        },
    },
    {
        accessorKey: "minOrderAmount",
        header: "Min Order Amount",
        cell: ({ row }) => {
            const data = row.original;
            return formatPriceTag(+convertPaiseToRupees(data.minOrderAmount));
        },
    },
    {
        accessorKey: "maxDiscountAmount",
        header: "Max Discount Amount",
        cell: ({ row }) => {
            const data = row.original;
            return data.maxDiscountAmount
                ? data.discountType === "percentage"
                    ? `${data.maxDiscountAmount}%`
                    : formatPriceTag(
                          +convertPaiseToRupees(data.maxDiscountAmount)
                      )
                : "∞";
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const data = row.original;

            return (
                <Badge variant={data.isActive ? "default" : "destructive"}>
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
            return <CouponAction coupon={data} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: CouponWithCategory[];
        count: number;
    };
}

export function CouponsTable({ initialData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });
    const [isActive, setIsActive] = useQueryState(
        "isActive",
        parseAsBoolean.withDefault(true)
    );

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const {
        data: { data: dataRaw, count },
    } = trpc.general.coupons.getCoupons.useQuery(
        { page, limit, search, isActive },
        { initialData }
    );

    const data = useMemo(
        () =>
            dataRaw.map((x) => ({
                ...x,
                status: x.isActive ? "active" : "inactive",
                categoryName: x.category?.name ?? null,
                subCategoryName: x.subCategory?.name ?? null,
                productTypeName: x.productType?.name ?? null,
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
                        placeholder="Search by code..."
                        value={
                            (table
                                .getColumn("code")
                                ?.getFilterValue() as string) ?? search
                        }
                        onChange={(event) => {
                            table
                                .getColumn("code")
                                ?.setFilterValue(event.target.value);
                            setSearch(event.target.value);
                        }}
                    />

                    <Select
                        value={
                            (table
                                .getColumn("status")
                                ?.getFilterValue() as string) ??
                            (isActive !== undefined || isActive === true
                                ? "active"
                                : "inactive")
                        }
                        onValueChange={(value) => {
                            table.getColumn("status")?.setFilterValue(value);
                            setIsActive(value === "active");
                        }}
                    >
                        <SelectTrigger className="capitalize">
                            <SelectValue placeholder="Search by status" />
                        </SelectTrigger>
                        <SelectContent>
                            {["active", "inactive"].map((x) => (
                                <SelectItem key={x} value={x}>
                                    {convertValueToLabel(x)}
                                </SelectItem>
                            ))}
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
