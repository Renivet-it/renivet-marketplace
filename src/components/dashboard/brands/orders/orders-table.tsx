// "use client";

// import { Badge } from "@/components/ui/badge";
// import { DataTable } from "@/components/ui/data-table";
// import { DataTableViewOptions } from "@/components/ui/data-table-dash";
// import { Input } from "@/components/ui/input-dash";
// import { trpc } from "@/lib/trpc/client";
// import {
//     convertPaiseToRupees,
//     convertValueToLabel,
//     formatPriceTag,
// } from "@/lib/utils";
// import { usePathname } from "next/navigation";
// import { Order } from "@/lib/validations";
// import {
//     ColumnDef,
//     ColumnFiltersState,
//     getCoreRowModel,
//     getFilteredRowModel,
//     getPaginationRowModel,
//     getSortedRowModel,
//     SortingState,
//     useReactTable,
//     VisibilityState,
// } from "@tanstack/react-table";
// import { format } from "date-fns";
// import Link from "next/link";
// import { parseAsInteger, useQueryState } from "nuqs";
// import { useMemo, useState } from "react";
// import { OrderAction } from "./order-action";

// export type TableOrder = Order;

// const columns = (onAction: () => void): ColumnDef<TableOrder>[] => [
// {
//     accessorKey: "id",
//     header: "Order ID",
//     enableHiding: false,
//     cell: ({ row }) => {
//         "use client"; // ensure this cell runs on client side

//         const data = row.original;
//         const pathname = usePathname();

//         return (
//             <Link
//                 className="text-blue-500 hover:underline"
//                 href={`${pathname}/${data.id}`}
//             >
//                 {data.id}
//             </Link>
//         );
//     },
// },
//     {
//         accessorKey: "fullName",
//         header: "Customer Name",
//         cell: ({ row }) => {
//             const data = row.original;
//             return `${data.firstName} ${data.lastName}`; // Combine firstName and lastName
//         },
//     },
//     {
//         accessorKey: "totalAmount",
//         header: "Total",
//         cell: ({ row }) => {
//             const data = row.original;
//             return formatPriceTag(
//                 +convertPaiseToRupees(data.totalAmount),
//                 true
//             );
//         },
//     },
//     {
//         accessorKey: "totalItems",
//         header: "Total Items",
//     },
//     {
//         accessorKey: "status",
//         header: "Status",
//         cell: ({ row }) => {
//             const data = row.original;
//             return <Badge>{convertValueToLabel(data.status)}</Badge>;
//         },
//     },
//     {
//         accessorKey: "createdAt",
//         header: "Created At",
//         cell: ({ row }) => {
//             const data = row.original;
//             return format(new Date(data.createdAt), "MMM dd, yyyy");
//         },
//     },
//      {
//             id: "actions",
//             cell: ({ row }) => {
//                 const data = row.original;
//                 console.log("Order actions data:", data);
//                 return <OrderAction order={data} onAction={onAction}/>;
//             },
//      },
// ];

// interface PageProps {
//     initialData: Order[];
//     brandId: string;
//     totalCount: number;
//     shipmentStatus?: string;
// }

// export function OrdersTable({ initialData, brandId, totalCount, shipmentStatus }: PageProps) {
//     const [page] = useQueryState("page", parseAsInteger.withDefault(1));
//     const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
//     const [sorting, setSorting] = useState<SortingState>([]);
//     const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
//     const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
//     const [rowSelection, setRowSelection] = useState({});

//     const { data, refetch } = trpc.brands.orders.getOrdersByBrandId.useQuery(
//         { brandId, page, limit, shipmentStatus },
//         {
//             initialData: page === 1 ? { data: initialData, total: totalCount } : undefined,
//         }
//     );

//     const tableData = useMemo(() => data?.data ?? [], [data]);
//     const count = data?.total ?? 0;
//     const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

//     const table = useReactTable({
//         data: tableData,
//         columns: columns(refetch),
//         getCoreRowModel: getCoreRowModel(),
//         getPaginationRowModel: getPaginationRowModel(),
//         onSortingChange: setSorting,
//         getSortedRowModel: getSortedRowModel(),
//         onColumnFiltersChange: setColumnFilters,
//         getFilteredRowModel: getFilteredRowModel(),
//         onColumnVisibilityChange: setColumnVisibility,
//         onRowSelectionChange: setRowSelection,
//         state: {
//             sorting,
//             columnFilters,
//             columnVisibility,
//             rowSelection,
//         },
//     });

//     return (
//         <div className="space-y-4">
//             <div className="flex items-center gap-2">
//                 <div className="w-full md:w-auto">
//                     <Input
//                         placeholder="Search by order id..."
//                         value={
//                             (table
//                                 .getColumn("id")
//                                 ?.getFilterValue() as string) ?? ""
//                         }
//                         onChange={(event) =>
//                             table
//                                 .getColumn("id")
//                                 ?.setFilterValue(event.target.value)
//                         }
//                     />
//                 </div>

//                 <DataTableViewOptions table={table} />
//             </div>

//             <DataTable
//                 columns={columns(refetch)}
//                 table={table}
//                 pages={pages}
//                 count={count}
//             />
//         </div>
//     );
// }

"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog-dash";
import { Button } from "@/components/ui/button-dash";
import { trpc } from "@/lib/trpc/client";
import {
  convertPaiseToRupees,
  convertValueToLabel,
  formatPriceTag,
} from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Order } from "@/lib/validations";
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
import Link from "next/link";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { OrderAction } from "./order-action";

export type TableOrder = Order;

/* ----------------------------------------
   Helpers
---------------------------------------- */

const volumetricWeightGrams = (l: number, b: number, h: number) =>
  Math.round(((l * b * h) / 5));

/* ----------------------------------------
   Dimension Edit Modal
---------------------------------------- */

function DimensionEditModal({
  open,
  onClose,
  order,
}: {
  open: boolean;
  onClose: () => void;
  order: TableOrder;
}) {
  // ✅ STRING STATE (IMPORTANT)
  const [length, setLength] = useState(
    order?.givenLength !== null && order?.givenLength !== undefined
      ? String(order.givenLength)
      : ""
  );
  const [breadth, setBreadth] = useState(
    order?.givenWidth !== null && order?.givenWidth !== undefined
      ? String(order.givenWidth)
      : ""
  );
  const [height, setHeight] = useState(
    order?.givenHeight !== null && order?.givenHeight !== undefined
      ? String(order.givenHeight)
      : ""
  );

  // convert safely
  const l = Number(length);
  const b = Number(breadth);
  const h = Number(height);

  const volWeight =
    l > 0 && b > 0 && h > 0
      ? Math.round((l * b * h) / 5)
      : 0;

  const handleSave = () => {
    const payload = {
      orderId: order.id,
      givenLength: l || null,
      givenWidth: b || null,
      givenHeight: h || null,
      volumetricWeight: volWeight,
    };

    console.log("📦 DIMENSION PAYLOAD READY:", payload);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Package Dimensions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Length */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Length (cm)</label>
            <Input
              type="number"
              value={length}
              placeholder="Enter length"
              onChange={(e) => setLength(e.target.value)}
            />
          </div>

          {/* Breadth */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Breadth (cm)</label>
            <Input
              type="number"
              value={breadth}
              placeholder="Enter breadth"
              onChange={(e) => setBreadth(e.target.value)}
            />
          </div>

          {/* Height */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Height (cm)</label>
            <Input
              type="number"
              value={height}
              placeholder="Enter height"
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>

          {/* Volumetric weight */}
          <div className="text-sm text-muted-foreground">
            Volumetric Weight:{" "}
            <span className="font-semibold text-foreground">
              {volWeight} g
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/* ----------------------------------------
   Columns
---------------------------------------- */

const columns = (
  onAction: () => void,
  onEdit: (order: TableOrder) => void
): ColumnDef<TableOrder>[] => [
  {
    accessorKey: "id",
    header: "Order ID",
    enableHiding: false,
    cell: ({ row }) => {
      const data = row.original;
      const pathname = usePathname();

      return (
        <Link
          className="text-blue-500 hover:underline"
          href={`${pathname}/${data.id}`}
        >
          {data.id}
        </Link>
      );
    },
  },
  {
    header: "Customer",
    cell: ({ row }) => {
      const d = row.original;
      return `${d.firstName} ${d.lastName}`;
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) =>
      formatPriceTag(+convertPaiseToRupees(row.original.totalAmount), true),
  },
  {
    header: "Dimensions",
    cell: ({ row }) => {
      const d = row.original;

      const l = d?.givenLength ?? 0;
      const b = d?.givenWidth ?? 0;
      const h = d?.givenHeight ?? 0;

      const vol = volumetricWeightGrams(l, b, h);
      const canEdit =
        d.status !== "cancelled" &&
        d.status !== "delivered" &&
        d.status !== "shipped";

      return (
        <div className="space-y-1 text-xs">
          <div>{`${l} × ${b} × ${h} cm`}</div>
          <div className="text-muted-foreground">{vol} g</div>
          {canEdit && (
            <button
              className="text-blue-500 hover:underline text-xs"
              onClick={() => onEdit(d)}
            >
              Edit
            </button>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge>{convertValueToLabel(row.original.status)}</Badge>
    ),
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
      <OrderAction order={row.original} onAction={onAction} />
    ),
  },
];

/* ----------------------------------------
   Orders Table
---------------------------------------- */

interface PageProps {
  initialData: Order[];
  brandId: string;
  totalCount: number;
  shipmentStatus?: string;
}

export function OrdersTable({
  initialData,
  brandId,
  totalCount,
  shipmentStatus,
}: PageProps) {
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [selectedOrder, setSelectedOrder] =
    useState<TableOrder | null>(null);

  const { data, refetch } =
    trpc.brands.orders.getOrdersByBrandId.useQuery(
      { brandId, page, limit, shipmentStatus },
      {
        initialData:
          page === 1
            ? { data: initialData, total: totalCount }
            : undefined,
      }
    );

  const table = useReactTable({
    data: data?.data ?? [],
    columns: columns(refetch, setSelectedOrder),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  return (
    <>
      <DataTable
        columns={columns(refetch, setSelectedOrder)}
        table={table}
        pages={Math.ceil((data?.total ?? 0) / limit)}
        count={data?.total ?? 0}
      />

      {selectedOrder && (
        <DimensionEditModal
          open={!!selectedOrder}
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </>
  );
}
