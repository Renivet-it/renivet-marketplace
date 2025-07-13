"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc/client";
import { WomenHomeBrandProduct } from "@/lib/validations";
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
import Image from "next/image";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { ShopByCategoryAction } from "./shop-by-category-action";

export type TableShopByCategory = WomenHomeBrandProduct;

const columns: ColumnDef<TableShopByCategory>[] = [
    {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }) => {
            const data = row.original;
            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <button className="relative size-10 overflow-hidden rounded-md">
                            <Image
                                src={data.imageUrl}
                                alt="Product"
                                fill
                                className="object-cover"
                            />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 overflow-hidden p-0">
                        <div className="relative aspect-[4/5] w-full overflow-hidden">
                            <Image
                                src={data.imageUrl}
                                alt="Product"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </PopoverContent>
                </Popover>
            );
        },
    },
    {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
            const data = row.original;
            return format(new Date(data.createdAt), "MMM dd, yyyy");
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
            return <ShopByCategoryAction shopByCategory={data} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: WomenHomeBrandProduct[];
        count: number;
    };
}

export function ShopByCategoriesTable({ initialData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const { data = [], isLoading } =
        trpc.general.content.beautyExploreCategoryRouter.getwomenHomeBanners.useQuery(
            { page, limit },
            {
                initialData: initialData.data as any[],
            }
        );

    const count = initialData.count;
    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    const table = useReactTable({
        data,
        //@ts-ignore
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
                <DataTableViewOptions table={table} />
            </div>

            <DataTable
                columns={columns as any[]}
                table={table}
                pages={pages}
                count={count}
            />
        </div>
    );
}
