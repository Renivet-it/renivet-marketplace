"use client";

import {
    BRAND_TIER_LABELS,
    BRAND_TIER_VALUES,
    BrandTier,
} from "@/config/brand-program";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc/client";
import { BrandTierMetrics } from "@/lib/brand-tier";
import { CachedBrand } from "@/lib/validations";
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
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandAction } from "./brand-action";

export type TableBrand = CachedBrand & {
    ownerName: string;
    memberCount: number;
    subscribedTo: string;
    tier: BrandTier;
    tierBase: Exclude<BrandTier, "tier_0" | "offboarded">;
    tierReason: string;
    tierMetrics: BrandTierMetrics;
};

type BrandTableSource = CachedBrand & {
    tier: BrandTier;
    tierBase: Exclude<BrandTier, "tier_0" | "offboarded">;
    tierReason: string;
    tierMetrics: BrandTierMetrics;
};

const columns: ColumnDef<TableBrand>[] = [
    {
        accessorKey: "id",
        header: "ID",
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: "Name",
        enableHiding: false,
    },
    {
        accessorKey: "email",
        header: "Email",
        enableHiding: false,
    },
    {
        accessorKey: "subscribedTo",
        header: "Subscribed To",
    },
    {
        accessorKey: "tier",
        header: "Tier",
        cell: ({ row }) => {
            const brand = row.original;

            return (
                <Badge variant="outline" title={brand.tierReason}>
                    {BRAND_TIER_LABELS[brand.tier]}
                </Badge>
            );
        },
    },
    {
        accessorKey: "ownerName",
        header: "Owner",
    },
    {
        accessorKey: "memberCount",
        header: "Members",
    },

    {
        accessorKey: "phone",
        header: "Phone Number",
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
            const brand = row.original;
            const isOffboarded = !brand.isActive;

            return (
                <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isOffboarded
                            ? "bg-slate-200 text-slate-800"
                            : brand.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                    }`}
                >
                    {isOffboarded ? "Offboarded" : "Active"}
                </span>
            );
        },
    },

    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const waitlist = row.original;
            return format(new Date(waitlist.createdAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => <BrandAction brand={row.original} />,
    },
];

interface PageProps {
    initialData: {
        data: BrandTableSource[];
        count: number;
        tierCounts: Record<BrandTier, number>;
    };
}

export function BrandsTable({ initialData }: PageProps) {
    const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });
    const [tier, setTier] = useQueryState(
        "tier",
        parseAsStringLiteral(BRAND_TIER_VALUES).withDefault("tier_1")
    );

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const { data: queryData } = trpc.general.brands.getBrands.useQuery(
        { page, limit, search, tier },
        { initialData }
    );
    const dataRaw = queryData?.data ?? [];
    const count = queryData?.count ?? 0;
    const tierCounts = queryData?.tierCounts ?? initialData.tierCounts;

    const data = useMemo(
        () =>
            dataRaw.map((x) => {
                const subscribedPlan = x.subscriptions.find((s) => s.isActive);

                return {
                    ...x,
                    ownerName: `${x.owner.firstName} ${x.owner.lastName}`,
                    memberCount: x.members.length,
                    subscribedTo: subscribedPlan?.plan.name ?? "N/A",
                };
            }),
        [dataRaw]
    );

    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    const table = useReactTable({
        data,
        columns,
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
        <div className="space-y-4">
            <Tabs
                value={tier}
                onValueChange={(value) => {
                    setTier(value as BrandTier);
                    setPage(1);
                }}
                className="w-full"
            >
                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                    <TabsList className="flex h-auto min-w-max flex-nowrap items-center gap-2 bg-transparent p-0">
                        {BRAND_TIER_VALUES.map((value) => (
                            <TabsTrigger
                                key={value}
                                value={value}
                                className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors data-[state=active]:border-slate-900 data-[state=active]:text-slate-950"
                            >
                                {BRAND_TIER_LABELS[value]}
                                <span className="ml-2 text-xs text-muted-foreground">
                                    {tierCounts[value] ?? 0}
                                </span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
            </Tabs>

            <div className="flex items-center gap-2">
                <div className="w-full md:w-auto">
                    <Input
                        placeholder="Search by brand name..."
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
                            setPage(1);
                        }}
                    />
                </div>

                <DataTableViewOptions table={table} />
            </div>

            <DataTable
                table={table}
                columns={columns}
                count={count}
                pages={pages}
            />
        </div>
    );
}
