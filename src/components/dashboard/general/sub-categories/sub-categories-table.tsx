"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { CachedCategory, SubCategory } from "@/lib/validations";
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
import { SubCategoryAction } from "./sub-category-action";

export type TableSubCategory = SubCategory & {
    productTypes: number;
    category: string;
};

const columns: ColumnDef<TableSubCategory>[] = [
    {
        accessorKey: "name",
        header: "Name",
        enableHiding: false,
    },
    {
        accessorKey: "category",
        header: "Category",
    },
    {
        accessorKey: "productTypes",
        header: "Product Types",
    },
    {
        accessorKey: "rank",
        header: "Rank",
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
            return <SubCategoryAction subCategory={data} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: (SubCategory & {
            productTypes: number;
        })[];
        count: number;
    };
    categories: CachedCategory[];
}

export function SubCategoriesTable({ initialData, categories }: PageProps) {
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
    } = trpc.general.subCategories.getSubCategories.useQuery(undefined, {
        initialData,
    });

    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    const data = useMemo(
        () =>
            dataRaw
                .map((subCategory) => ({
                    ...subCategory,
                    category:
                        categories.find(
                            (category) => category.id === subCategory.categoryId
                        )?.name ?? "",
                }))
                .slice((page - 1) * limit, page * limit),
        [dataRaw, page, limit, categories]
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
                <div className="flex w-full flex-col items-center gap-2 md:w-auto md:flex-row">
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
