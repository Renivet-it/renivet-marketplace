"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { OrderIntentDetailsModal } from "./OrderIntentDetailsModal";
import { Button } from "@/components/ui/button-general"; // ✅ Correct Button import!
import { OrderWithItemAndBrand } from "@/lib/validations";

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

// ✅ Type
export type TableOrder = OrderWithItemAndBrand;

// ✅ Columns (now receives onView)
const columns = (onView: (title: string, data: any) => void): ColumnDef<TableOrder>[] => [
  {
    accessorKey: "id",
    header: "Order Intent ID",
    enableHiding: false,
    cell: ({ row }) => row.original.id,
  },
  {
    accessorKey: "user_id",
    header: "Customer Name",
    cell: ({ row }) => {
      const data = row.original;
      return `${data?.user?.firstName} ${data?.user?.lastName}`;
    },
  },
  {
    accessorKey: "title",
    header: "Product Name",
    cell: ({ row }) => row.original.product?.title || "—",
  },

  // ✅ Shiprocket Request
  {
    header: "Shiprocket Request",
    cell: ({ row }) => {
      const req = row.original.shiprocketRequest;
      return req ? (
        <Button variant="outline" size="sm" onClick={() => onView("Shiprocket Request", req)}>
          View
        </Button>
      ) : (
        <span className="text-gray-400 italic">No Request</span>
      );
    },
  },

  // ✅ Shiprocket Response
  {
    header: "Shiprocket Response",
    cell: ({ row }) => {
      const res = row.original.shiprocketResponse;
      return res ? (
        <Button variant="outline" size="sm" onClick={() => onView("Shiprocket Response", res)}>
          View
        </Button>
      ) : (
        <span className="text-gray-400 italic">No Response</span>
      );
    },
  },

  // ✅ Order Log
  {
    header: "Order Log",
    cell: ({ row }) => {
      const log = row.original.orderLog;
      return log ? (
        <Button variant="outline" size="sm" onClick={() => onView("Order Log", log)}>
          View
        </Button>
      ) : (
        <span className="text-gray-400 italic">No Logs</span>
      );
    },
  },

  {
    accessorKey: "payment_status",
    header: "Payment Status",
    cell: ({ row }) => row.original.paymentStatus,
  },
  {
    accessorKey: "createdAt",
    header: "Intended Time",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "MMM dd, yyyy 'at' h:mm a"),
  },
];

interface PageProps {
  initialData: {
    data: OrderWithItemAndBrand[];
    count: number;
  };
}

export function OrdersTable({ initialData }: PageProps) {
  // ✅ Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalData, setModalData] = useState<any>(null);

  // ✅ Show Modal with Data
  const handleView = (title: string, data: any) => {
    setModalTitle(title);
    setModalData(data);
    setModalOpen(true);
  };

  // ✅ Query + Table Logic
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const { data: { data: dataRaw, count } } = trpc.general.orders.getAllIntents.useQuery(
    { page, limit, search },
    { initialData }
  );

  const data = useMemo(() => dataRaw.map((x) => x), [dataRaw]);
  const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

  const table = useReactTable({
    data,
    columns: columns(handleView),
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
      {/* ✅ Search */}
      <div className="flex items-center gap-2">
        <div className="w-full md:w-auto">
          <Input
            placeholder="Search by order ID..."
            value={(table.getColumn("id")?.getFilterValue() as string) ?? search}
            onChange={(e) => {
              table.getColumn("id")?.setFilterValue(e.target.value);
              setSearch(e.target.value);
            }}
          />
        </div>
        <DataTableViewOptions table={table} />
      </div>

      {/* ✅ Table */}
      <DataTable columns={columns(handleView)} table={table} pages={pages} count={count} />

      {/* ✅ Modal (Reusable) */}
      <OrderIntentDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        data={modalData}
      />
    </div>
  );
}
