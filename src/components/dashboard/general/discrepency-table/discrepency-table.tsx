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

/* ================= TYPES ================= */

export type TableShipmentDiscrepancy = {
  id: string;
  orderId: string;
  brand: { id: string; name: string };
  product: { id: string; title: string };
  brandProductTypePacking?: {
    id: string;
    packingType?: { name: string } | null;
  } | null;
  actualWeight: number;
  volumetricWeight: number;
  length: number;
  width: number;
  height: number;
  rulesViolated: string[];
  createdAt: Date;
};

/* ================= COLUMNS ================= */

const columns: ColumnDef<TableShipmentDiscrepancy>[] = [
  { accessorKey: "orderId", header: "Order ID" },
  { accessorKey: "brand.name", header: "Brand" },
  { accessorKey: "product.title", header: "Product" },
  {
    header: "Packing Rule",
    cell: ({ row }) =>
      row.original.brandProductTypePacking?.packingType?.name ?? "—",
  },
  { header: "Actual (g)", cell: ({ row }) => row.original.actualWeight },
  {
    header: "Volumetric (g)",
    cell: ({ row }) => row.original.volumetricWeight,
  },
  {
    header: "Dimensions (cm)",
    cell: ({ row }) =>
      `${row.original.length} × ${row.original.width} × ${row.original.height}`,
  },
  {
    header: "Rules Violated",
    cell: ({ row }) => row.original.rulesViolated.join(", "),
  },
  {
    accessorKey: "createdAt",
    header: "Detected On",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "dd MMM yyyy"),
  },
];

/* ================= COMPONENT ================= */

export function ShipmentDiscrepancyTable({
  initialData,
}: {
  initialData: {
    data: TableShipmentDiscrepancy[];
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

  /* 🔥 CRITICAL SYNC FIX */
  useEffect(() => {
    table.setPageIndex(page - 1);
    table.setPageSize(limit);
  }, [page, limit, search]); // 🔥 reacts to URL changes

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2">
        <Input
          placeholder="Search by order / brand / product…"
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
      <p className="text-sm text-muted-foreground">
  Showing <strong>{from}</strong>–<strong>{to}</strong> of{" "}
  <strong>{initialData.count}</strong> results
</p>

    </div>
  );
}
