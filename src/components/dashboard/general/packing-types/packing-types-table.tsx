"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
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
import { PackingTypeAction } from "./packing-type-action";

/* ================= TYPES ================= */

export type TablePackingType = {
  id: string;
  hsCode: string | null;
  baseLength: number;
  baseWidth: number;
  baseHeight: number;
  extraCm: number;
  createdAt: Date;
};

/* ================= COLUMNS ================= */

const columns: ColumnDef<TablePackingType>[] = [
  {
    accessorKey: "hsCode",
    header: "HS Code",
  },
  {
    header: "Base Size (L × W × H)",
    cell: ({ row }) => {
      const d = row.original;
      return `${d.baseLength} × ${d.baseWidth} × ${d.baseHeight} cm`;
    },
  },
  {
    accessorKey: "extraCm",
    header: "Extra CM",
    cell: ({ row }) => `+${row.original.extraCm} cm`,
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "MMM dd, yyyy"),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <PackingTypeAction packingType={row.original} />
    ),
  },
];

/* ================= COMPONENT ================= */

interface PageProps {
  initialData: {
    data: TablePackingType[];
    count: number;
  };
}

export function PackingTypesTable({ initialData }: PageProps) {
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const {
    data: { data: dataRaw, count },
  } = trpc.general.packingTypes.getAll.useQuery(undefined, {
    initialData,
  });

  const pages = useMemo(
    () => Math.ceil(count / limit) || 1,
    [count, limit]
  );

  const data = useMemo(
    () => dataRaw.slice((page - 1) * limit, page * limit),
    [dataRaw, page, limit]
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
        <div className="w-full md:w-auto">
          <Input
            placeholder="Search by HS code..."
            value={
              (table
                .getColumn("hsCode")
                ?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table
                .getColumn("hsCode")
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
