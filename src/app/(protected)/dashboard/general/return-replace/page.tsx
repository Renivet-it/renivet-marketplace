"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import { parseAsInteger, useQueryState } from "nuqs";

import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { Button } from "@/components/ui/button-general";
import { ReturnReplaceDetailsModal } from "./ReturnReplaceDetailsModal";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";

import { format } from "date-fns";
import { toast } from "sonner";

// ---------------------------------------------------------------
// TYPE
// ---------------------------------------------------------------

export type ReturnReplaceRow = {
  id: string;
  orderId: string;
  orderItemId: string;
  user: {
    firstName: string;
    lastName: string;
  };
  brandId: string;
  requestType: "return" | "replace";
  newVariantId?: string | null;
  reason?: string | null;
  comment?: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

// ---------------------------------------------------------------
// COLUMNS
// ---------------------------------------------------------------

const columns = (
  onView: (row: ReturnReplaceRow) => void,
  onApprove: (id: string) => void,
  onReject: (id: string) => void
): ColumnDef<ReturnReplaceRow>[] => [

  {
    accessorKey: "orderId",
    header: "Order ID",
    cell: ({ row }) => row.original.orderId
  },

  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const u = row.original.user;
      return `${u.firstName} ${u.lastName}`;
    }
  },

  {
    accessorKey: "requestType",
    header: "Type",
    cell: ({ row }) =>
      row.original.requestType === "return" ? (
        <span className="text-red-600 font-medium">Return</span>
      ) : (
        <span className="text-blue-600 font-medium">Replace</span>
      )
  },

  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => row.original.reason || "—"
  },

  {
    accessorKey: "createdAt",
    header: "Requested At",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "MMM dd, yyyy")
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      return (
        <span
          className={
            s === "pending"
              ? "text-yellow-600"
              : s === "approved"
              ? "text-green-600"
              : "text-red-600"
          }
        >
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </span>
      );
    }
  },

  {
    header: "Actions",
    cell: ({ row }) => {
      const data = row.original;

      return (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onView(data)}>
            View
          </Button>

          {data.status === "pending" && (
            <>
              <Button
                size="sm"
                className="bg-green-600 text-white"
                onClick={() => onApprove(data.id)}
              >
                Approve
              </Button>

              <Button
                size="sm"
                className="bg-red-600 text-white"
                onClick={() => onReject(data.id)}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      );
    }
  }
];

// ---------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------

export default function Page() {
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ReturnReplaceRow | null>(null);

  const handleView = (row: ReturnReplaceRow) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  // Pagination + Filters
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState("search", {
    defaultValue: ""
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Data
  const { data, refetch } =
    trpc.general.returnReplace.getRequests.useQuery({
      page,
      limit,
      search
    });

  const rows = useMemo(() => data?.data ?? [], [data]);
  const pages = useMemo(
    () => Math.ceil((data?.count ?? 1) / limit),
    [data, limit]
  );

  // Mutations
  const approveMutation =
    trpc.general.returnReplace.approveRequest.useMutation();
  const rejectMutation =
    trpc.general.returnReplace.rejectRequest.useMutation();

const createRTO = trpc.general.returnReplace.createRTOShipment.useMutation();
const createRepl = trpc.general.returnReplace.createReplShipment.useMutation();

const onApprove = async (id: string) => {
  try {
    toast.loading("Approving...");

    // 1️⃣ Mark the request as approved
    await approveMutation.mutateAsync({ id });

    // 2️⃣ Find the row (to know if return or replace)
    const req = rows.find((r) => r.id === id);
    if (!req) throw new Error("Request not found in table");

    // 3️⃣ Call correct Delhivery shipment API
    if (req.requestType === "return") {
      toast.loading("Creating RTO shipment...");
      await createRTO.mutateAsync({ requestId: id });
      toast.success("RTO Shipment created!");
    }
    else if (req.requestType === "replace") {
      toast.loading("Creating REPL shipment...");
      await createRepl.mutateAsync({ requestId: id });
      toast.success("REPL Shipment created!");
    }

    toast.success("Request Approved");
    refetch();
  } catch (e: any) {
    toast.error(e.message || "Something went wrong");
  }
};


  const onReject = async (id: string) => {
    toast.loading("Rejecting...");
    await rejectMutation.mutateAsync({ id });
    toast.success("Rejected");
    refetch();
  };

  // Table
  const table = useReactTable({
    data: rows,
    columns: columns(handleView, onApprove, onReject),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,

    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  return (
    <div className="space-y-4 p-5">
      <h1 className="text-xl font-semibold">Return & Replace Requests</h1>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by order ID..."
          value={(table.getColumn("orderId")?.getFilterValue() as string) ?? search}
          onChange={(e) => {
            table.getColumn("orderId")?.setFilterValue(e.target.value);
            setSearch(e.target.value);
          }}
        />

        <DataTableViewOptions table={table} />
      </div>

      {/* Table */}
      <DataTable
        columns={columns(handleView, onApprove, onReject)}
        table={table}
        pages={pages}
        count={data?.count ?? 0}
      />

      {/* Modal */}
      <ReturnReplaceDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={selectedRow}
      />
    </div>
  );
}
