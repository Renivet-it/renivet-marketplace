"use client";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { BrandProductPackingAction } from "./packing-type-action";

/* ================= TYPES ================= */

export type TableBrandProductPacking = {
  id: string;

  brand: { id: string; name: string };
  productType: { id: string; name: string };
  packingType: { id: string; name: string } | null;

  isFragile: boolean;
  shipsInOwnBox: boolean;
  canOverride: boolean;

  createdAt: Date;
};

/* ================= COLUMNS ================= */

const columns: ColumnDef<TableBrandProductPacking>[] = [
  { accessorKey: "brand.name", header: "Brand" },
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

/* ================= COMPONENT ================= */

export function BrandProductPackingTable() {
  const [page, setPage] = useState(1);

  const { data } =
    trpc.general.brandProductTypePacking.getAll.useQuery({
      page,
      limit: 10,
    });

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input placeholder="Search..." />
        <DataTableViewOptions table={table} />
      </div>

      <DataTable
        table={table}
        columns={columns}
        count={data?.count ?? 0}
        pages={Math.ceil((data?.count ?? 1) / 10)}
      />
    </div>
  );
}
