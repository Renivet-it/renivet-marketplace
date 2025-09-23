"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { cn, convertPaiseToRupees } from "@/lib/utils";
import { ProductWithBrand } from "@/lib/validations";
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

export type TableProduct = ProductWithBrand;

const columns = (): ColumnDef<TableProduct>[] => [
  {
    accessorKey: "id",
    header: "Product ID",
    enableHiding: false,
    cell: ({ row }) => {
      const data = row.original;
      return data?.id;
    },
  },
  {
    accessorKey: "title",
    header: "Product Name",
    cell: ({ row }) => {
      const data = row.original;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{data?.title}</span>
          <span className="text-xs text-muted-foreground">
            {data?.brand?.name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const data = row.original;
      return (
        <span>
          ₹{convertPaiseToRupees(data?.price ?? 0)}
        </span>
      );
    },
  },
  {
    accessorKey: "availability",
    header: "Availability",
    cell: ({ row }) => {
      const data = row.original;
      const inStock = (data?.quantity ?? 0) > 0;
      return (
        <Badge
          className={cn(inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}
        >
          {inStock ? "In Stock" : "Out of Stock"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Added On",
    cell: ({ row }) => {
      const data = row.original;
      return format(new Date(data.createdAt), "MMM dd, yyyy");
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const data = row.original;
      return (
        <div className="flex gap-2">
          <a
            href={`/products/${data.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View
          </a>
          <button
            className="text-sm text-gray-600 hover:text-black"
            onClick={() => console.log("Syncing product:", data.id)}
          >
            Sync
          </button>
        </div>
      );
    },
  },
];

interface PageProps {
  initialData: {
    data: ProductWithBrand[];
    count: number;
  };
}

export function ProductsTable({ initialData }: PageProps) {
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const {
    data: { data: dataRaw, count },
    refetch,
    //@ts-ignore
  } = trpc.brands.products.getProducts.useQuery(
    { page, limit, search },
    { initialData }
  );
  //@ts-ignore
  const data = useMemo(() => dataRaw.map((x) => x), [dataRaw]);

  const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

  const table = useReactTable({
    data,
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <div className="w-full md:w-auto">
          <Input
            placeholder="Search products..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? search}
            onChange={(event) => {
              table.getColumn("title")?.setFilterValue(event.target.value);
              setSearch(event.target.value);
            }}
          />
        </div>
        <DataTableViewOptions table={table} />
      </div>

      {/* Data table */}
      <DataTable
        columns={columns()}
        table={table}
        pages={pages}
        count={count}
      />
    </div>
  );
}
