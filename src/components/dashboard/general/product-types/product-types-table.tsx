"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { CachedCategory, ProductType, SubCategory } from "@/lib/validations";
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
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { ProductTypeAction } from "./product-type-action";

export type TableProductType = ProductType & {
    category: string;
    subCategory: string;
    priority_id?: number; // ✅ added by rachana

};

const columns: ColumnDef<TableProductType>[] = [
    {
        accessorKey: "name",
        header: "Name",
        enableHiding: false,
    },
    {
        accessorKey: "subCategory",
        header: "Sub Category",
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    { accessorKey: "priority_id", header: "Priority Id" }, // added by rachana
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
            return <ProductTypeAction productType={data} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: ProductType[];
        count: number;
    };
    categories: CachedCategory[];
    subCategories: SubCategory[];
}

export function ProductTypesTable({
    initialData,
    categories,
    subCategories,
}: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});

    const {
        data: { data: dataRaw, count },
    } = trpc.general.productTypes.getProductTypes.useQuery(undefined, {
        initialData,
    });

    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    const data = useMemo(
        () =>
            dataRaw
                .map((p) => ({
                    ...p,
                    subCategory:
                        subCategories.find((s) => s.id === p.subCategoryId)
                            ?.name ?? "",
                            
                    category:
                        categories.find(
                            (c) =>
                                c.id ===
                                subCategories.find(
                                    (s) => s.id === p.subCategoryId
                                )?.categoryId
                        )?.name ?? "",
                        priority_id: p.priorityId, // ✅ added by rachana

                }))
                .slice((page - 1) * limit, page * limit),
        [dataRaw, page, limit, subCategories, categories]
    );

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
                <div className="space-y-2">
                    <div>
                        <Input
                            placeholder="Search by name..."
                            value={
                                (table
                                    .getColumn("name")
                                    ?.getFilterValue() as string) ?? ""
                            }
                            onChange={(event) =>
                                table
                                    .getColumn("name")
                                    ?.setFilterValue(event.target.value)
                            }
                        />
                    </div>

                    <div className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
                        <Input
                            placeholder="Search by category..."
                            value={
                                (table
                                    .getColumn("category")
                                    ?.getFilterValue() as string) ?? ""
                            }
                            onChange={(event) =>
                                table
                                    .getColumn("category")
                                    ?.setFilterValue(event.target.value)
                            }
                        />

                        <Input
                            placeholder="Search by sub-category..."
                            value={
                                (table
                                    .getColumn("subCategory")
                                    ?.getFilterValue() as string) ?? ""
                            }
                            onChange={(event) =>
                                table
                                    .getColumn("subCategory")
                                    ?.setFilterValue(event.target.value)
                            }
                        />
                    </div>
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
