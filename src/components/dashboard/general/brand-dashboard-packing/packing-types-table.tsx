"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs";
import { useEffect, useMemo } from "react";
import { BrandProductPackingAction } from "./packing-type-action";

export type TableBrandProductPacking = {
  id: string;
  productType: { id: string; name: string };
  packingType: { id: string; name: string } | null;
  isFragile: boolean;
  shipsInOwnBox: boolean;
  canOverride: boolean;
  createdAt: Date;
};

const columns: ColumnDef<TableBrandProductPacking>[] = [
  { accessorKey: "productType.name", header: "Product Type" },
  {
    header: "Packing Type",
    cell: ({ row }) =>
      row.original.packingType?.name ?? "Default",
  },
  {
    header: "Fragile",
    cell: ({ row }) => (row.original.isFragile ? "Yes" : "No"),
  },
  {
    header: "Own Box",
    cell: ({ row }) =>
      row.original.shipsInOwnBox ? "Yes" : "No",
  },
  {
    header: "Override",
    cell: ({ row }) =>
      row.original.canOverride ? "Yes" : "No",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "MMM dd, yyyy"),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <BrandProductPackingAction row={row.original} />
    ),
  },
];

export function BrandProductPackingTable({
  initialData,
}: {
  initialData: { data: TableBrandProductPacking[]; count: number };
}) {
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );

  const [limit] = useQueryState(
    "limit",
    parseAsInteger.withDefault(10)
  );

  const pages = Math.ceil(initialData.count / limit);

  const table = useReactTable({
    data: initialData.data,
    columns,
    manualPagination: true,
    pageCount: pages,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({
              pageIndex: page - 1,
              pageSize: limit,
            })
          : updater;

      setPage(next.pageIndex + 1);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    table.setPageIndex(page - 1);
  }, [page, limit, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search product type..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <DataTableViewOptions table={table} />
      </div>

      <DataTable
        table={table}
        columns={columns}
        count={initialData.count}
        pages={pages}
        showResults={false}
      />
    </div>
  );
}
