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
    header: "Packaging Delta",
    cell: ({ row }) =>
      row.original.packingType?.name ?? "Default",
  },
{
  header: "Measurement Delta (L × W × H)",
  cell: ({ row }) => {
    const packingType = row.original.packingType;

    if (!packingType) return "Default";

    const {
      name,
      baseLength,
      baseWidth,
      baseHeight,
      boxSize = "Box Size+", // 👈 assuming this exists
    } = packingType;

    // Safety check
    if (!baseLength || !baseWidth || !baseHeight) {
      return "Default";
    }

    // ✅ Special case for box-based packing
    if (
      name === "Fragile Box" ||
      name === "Hard Box"
    ) {
      if (!boxSize) return "Default";

      return `${boxSize + baseLength} × ${boxSize + baseWidth} × ${boxSize + baseHeight}`;
    }

    // ✅ Normal case
    return `${baseLength} × ${baseWidth} × ${baseHeight}`;
  },
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

export function BrandProductPackingTable({
  initialData,
}: {
  initialData: {
    data: TableBrandProductPacking[];
    count: number;
  };
}) {
  /* ---------------- URL STATE ---------------- */

  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({ shallow: false })
  );

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );

  const [limit] = useQueryState(
    "limit",
    parseAsInteger.withDefault(10).withOptions({ shallow: false })
  );

  /* ---------------- PAGINATION ---------------- */

  const pages = useMemo(
    () => Math.ceil(initialData.count / limit),
    [initialData.count, limit]
  );

  const from = useMemo(
    () => (initialData.count === 0 ? 0 : (page - 1) * limit + 1),
    [page, limit, initialData.count]
  );

  const to = useMemo(
    () => Math.min(page * limit, initialData.count),
    [page, limit, initialData.count]
  );

  /* ---------------- TABLE ---------------- */

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

  /* 🔥 KEEP TABLE IN SYNC WITH URL */
  useEffect(() => {
    table.setPageIndex(page - 1);
    table.setPageSize(limit);
  }, [page, limit, search]);

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search by brand or product type..."
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
          showResults={false} // 🔥 hides ONLY here
      />

      <p className="text-sm text-muted-foreground">
        Showing <strong>{from}</strong>–<strong>{to}</strong> of{" "}
        <strong>{initialData.count}</strong> results
      </p>
    </div>
  );
}
