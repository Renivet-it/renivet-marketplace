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

/* ---------------------------------------------------------------
   TYPE
---------------------------------------------------------------- */

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

/* ---------------------------------------------------------------
   PAGE
---------------------------------------------------------------- */

export default function Page() {
  // View modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] =
    useState<ReturnReplaceRow | null>(null);

  // Reject modal (🔥 NEW)
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleView = (row: ReturnReplaceRow) => {
    setSelectedRow(row);
    setModalOpen(true);
  };

  /* ---------------- Pagination & Filters ---------------- */

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

  /* ---------------- Data ---------------- */

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

  /* ---------------- Mutations ---------------- */

  const approveMutation =
    trpc.general.returnReplace.approveRequest.useMutation();
  const rejectMutation =
    trpc.general.returnReplace.rejectRequest.useMutation();

  const createRTO =
    trpc.general.returnReplace.createRTOShipment.useMutation();
  const createRepl =
    trpc.general.returnReplace.createReplShipment.useMutation();

  /* ---------------- Approve ---------------- */

  const onApprove = async (id: string) => {
    try {
const toastId = toast.loading("Approving request...");

      await approveMutation.mutateAsync({ id });

      const req = rows.find((r) => r.id === id);
      if (!req) throw new Error("Request not found");

      if (req.requestType === "return") {
        toast.loading("Creating RTO shipment...", { id: toastId });
        await createRTO.mutateAsync({ requestId: id });
     } else {
        toast.loading("Creating REPL shipment...", { id: toastId });

        await createRepl.mutateAsync({ requestId: id });

      }
toast.success("Request approved successfully", { id: toastId });

      refetch();
    } catch (e: any) {
  toast.error(e.message || "Something went wrong", { id: toastId });
}

  };

  /* ---------------- Reject (🔥 FINAL HANDLER) ---------------- */

  const onRejectConfirm = async () => {
    if (!rejectId || !rejectReason.trim()) return;

    try {
      const toastId = toast.loading("Rejecting...");

      await rejectMutation.mutateAsync({
        id: rejectId,
        comment: rejectReason
      });

      toast.success("Request Rejected", { id: toastId });
      setRejectModalOpen(false);
      setRejectId(null);
      setRejectReason("");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to reject");
    }
  };

  /* ---------------- Columns ---------------- */

  const columns: ColumnDef<ReturnReplaceRow>[] = [
    {
      accessorKey: "orderId",
      header: "Order ID"
    },
    {
      header: "Customer",
      cell: ({ row }) =>
        `${row.original.user.firstName} ${row.original.user.lastName}`
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
            {s}
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleView(data)}
            >
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
                  onClick={() => {
                    setRejectId(data.id);
                    setRejectReason("");
                    setRejectModalOpen(true);
                  }}
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

  /* ---------------- Table ---------------- */

  const table = useReactTable({
    data: rows,
    columns,
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
      <h1 className="text-xl font-semibold">
        Return & Replace Requests
      </h1>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by order ID..."
          value={
            (table.getColumn("orderId")?.getFilterValue() as string) ??
            search
          }
          onChange={(e) => {
            table.getColumn("orderId")?.setFilterValue(e.target.value);
            setSearch(e.target.value);
          }}
        />
        <DataTableViewOptions table={table} />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        table={table}
        pages={pages}
        count={data?.count ?? 0}
      />

      {/* View Modal */}
      <ReturnReplaceDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        data={selectedRow}
      />

      {/* Reject Modal (🔥 MINIMAL INLINE MODAL) */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="text-lg font-semibold">Reject Request</h2>

            <textarea
              className="mt-4 w-full rounded border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
              placeholder="Enter rejection reason (sent to customer)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!rejectReason.trim()}
                onClick={onRejectConfirm}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
