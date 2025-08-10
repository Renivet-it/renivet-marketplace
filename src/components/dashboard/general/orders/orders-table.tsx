"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import {
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
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
import { useMemo, useState } from "react";
import { OrderAction } from "./order-action";
import { OrderSingle } from "./order-single";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
    parseAsInteger,
    parseAsString,
    parseAsStringLiteral,
    useQueryState,
    parseAsArrayOf,
    parseAsIsoDate
} from "nuqs";
import { Button } from "@/components/ui/button-dash";
import { CachedBrand, ProductWithBrand } from "@/lib/validations";




export type TableOrder = OrderWithItemAndBrand;

const columns = (onAction: () => void): ColumnDef<TableOrder>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <input
                type="checkbox"
                checked={table.getIsAllPageRowsSelected()}
                onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
                className="cursor-pointer"
            />
        ),
        cell: ({ row }) => (
            <input
                type="checkbox"
                checked={row.getIsSelected()}
                onChange={(e) => row.toggleSelected(e.target.checked)}
                className="cursor-pointer"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: "Order ID",
        enableHiding: false,
        cell: ({ row }) => {
            const data = row.original;
            return <OrderSingle order={data} />;
        },
    },
    {
        accessorKey: "firstName",
        header: "Customer Name",
        cell: ({ row }) => {
            const data = row.original;
            return `${data?.user?.firstName} ${data?.user?.lastName}`;
        },
    },
    {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => {
            const data = row.original;
            return formatPriceTag(
                +convertPaiseToRupees(data.totalAmount),
                true
            );
        },
    },
    {
        accessorKey: "totalItems",
        header: "Total Items",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const data = row.original;
            return <Badge>{convertValueToLabel(data.status)}</Badge>;
        },
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => {
            const data = row.original;
            return format(new Date(data.createdAt), "MMM dd, yyyy");
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const data = row.original;
            return <OrderAction order={data} onAction={onAction} />;
        },
    },
];

interface PageProps {
    initialData: {
        data: OrderWithItemAndBrand[];
        count: number;
    };
        brandData?: {
            data: CachedBrand[];
            count: number;
        };
}

export function OrdersTable({ initialData, brandData }: PageProps) {
    const [page] = useQueryState("page", parseAsInteger.withDefault(1));
    const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
    const [search, setSearch] = useQueryState("search", {
        defaultValue: "",
    });
  const [brandFilter, setBrandFilter] = useQueryState(
        "brand",
        parseAsString.withDefault("all")
    );
    const [brandIds, setBrandIds] = useQueryState(
        "brandIds",
        parseAsArrayOf(parseAsString).withDefault([])
    );

     // NEW: Date range filters
    const [startDate, setStartDate] = useQueryState(
        "startDate",
        parseAsIsoDate.withDefault(null)
    );
    const [endDate, setEndDate] = useQueryState(
        "endDate",
        parseAsIsoDate.withDefault(null)
    );
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    const {
        data: { data: dataRaw, count },
        refetch: refetchOrderData,
        isLoading,
        error,
    } = trpc.general.orders.getOrders.useQuery(
        { page, limit, search, brandIds: brandIds.length > 0 ? brandIds : undefined, startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
            endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined, },
        { initialData }
    );
    const { data: brandsData } = trpc.general.brands.getBrands.useQuery(
        {
            page: 1, // Always fetch from first page
            limit: 150, // Use total count to fetch all brandData
            search,
        },
        {
            initialData: brandData, // Use brandData prop
        }
    );
    const data = useMemo(() => dataRaw.map((x) => x), [dataRaw]);
    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    const table = useReactTable({
        data,
        columns: columns(refetchOrderData),
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

const handleDownloadPDF = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    console.log( "Selected rows for PDF download:", selectedRows);
    if (selectedRows.length === 0) {
        alert("Please select at least one order to download as PDF.");
        return;
    }

    // Totals
    const totalGrossSale = selectedRows.reduce(
        (sum, row) => sum + +convertPaiseToRupees(row.original.totalAmount),
        0
    );
    const commissionRate = 0.25;
    const gstRate = 0.18;
    const tcsRate = 0.01;
    const paymentGatewayFee = 500.0;
    const shippingFee = 600.0;

    const commission = totalGrossSale * commissionRate;
    const gstOnCommission = commission * gstRate;
    const tcs = totalGrossSale * tcsRate;
    const totalDeductions =
        commission + gstOnCommission + tcs + paymentGatewayFee + shippingFee;
    const finalPayable = totalGrossSale - totalDeductions;

    // Create PDF
    const doc = new jsPDF();

    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Renivet Commission Invoice", 105, 15, { align: "center" });

    // Seller details
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Renivet Sustainable Marketplace", 14, 30);
    doc.text("GSTIN: 29ABCDE1234F1Z5", 14, 36);
    doc.text("Email: finance@renivet.com", 14, 42);

    // Buyer details
    doc.text("Invoice To: EGAICRAFT", 140, 30);
    doc.text("GSTIN: 33XYZAB1234F1Z2", 140, 36);
    doc.text("Period: 01-Jul-2025 to 31-Jul-2025", 140, 42);

autoTable(doc, {
    startY: 55,
    styles: {
        fontSize: 11,
        cellPadding: 3,
        overflow: "linebreak",
        halign: "left"
    },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    body: [
        ["Gross Sale Value (Incl. GST)", totalGrossSale],
        ["Commission @25%", commission],
        ["GST on Commission @18%", gstOnCommission],
        ["TCS @1% on Net MRP", tcs],
        ["Payment Gateway Fee", paymentGatewayFee],
        ["Shipping Fee", shippingFee],
        ["Total Deductions", totalDeductions],
        ["Final Payable to Brand", finalPayable],
        ["UTR Number", "XXXXXXXXXXXX"],
        ["Payment Date", "01-Aug-2025"],
    ],
    theme: "grid",
    columnStyles: {
        0: { cellWidth: 100, halign: "left" }, // Label column
        1: { cellWidth: 80, halign: "right" } // Amount column - more space now
    },
    didParseCell: (data) => {
        if (data.row.index === 6) {
            data.cell.styles.fillColor = [240, 240, 240];
        }
    },
});

    doc.save(`consolidated_invoice_${new Date().toISOString().split("T")[0]}.pdf`);
};

const handleDownloadBrandPDF = () => {
  const selectedRows = table.getSelectedRowModel().rows;
  if (selectedRows.length === 0) {
    alert("Please select at least one order to download as Brand PDF.");
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Header ---
  doc.setFont("helvetica", "bold").setFontSize(14);
  doc.text("INVOICE", pageWidth / 2, 40, { align: "center" });

  // Company Info (Right)
  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("P-593, Purna Das Road", pageWidth - 200, 60);
  doc.text("Kolkata - 700029", pageWidth - 200, 75);
  doc.text("Email: example@email.com", pageWidth - 200, 90);
  doc.text("ph: 9999999999", pageWidth - 200, 105);

  // --- Customer & Invoice Details Box ---
  const leftBoxX = 40;
  const topBoxY = 130;
  doc.setDrawColor(0);
  doc.rect(leftBoxX, topBoxY, pageWidth - 80, 70);

  doc.setFont("helvetica", "bold");
  doc.text("Customer Name:", leftBoxX + 5, topBoxY + 15);
  doc.setFont("helvetica", "normal");
  doc.text("Chara Ventures LLP", leftBoxX + 110, topBoxY + 15);

  doc.setFont("helvetica", "bold");
  doc.text("Address:", leftBoxX + 5, topBoxY + 30);
  doc.setFont("helvetica", "normal");
  doc.text("P-593, Purna Das Road, Suite - 302,", leftBoxX + 110, topBoxY + 30);
  doc.text("Kolkata - 700029", leftBoxX + 110, topBoxY + 45);

  doc.setFont("helvetica", "bold");
  doc.text("Phone Number:", leftBoxX + 5, topBoxY + 60);
  doc.setFont("helvetica", "normal");
  doc.text("9836922522", leftBoxX + 110, topBoxY + 60);

  doc.setFont("helvetica", "bold");
  doc.text("GSTIN No.:", leftBoxX + 5, topBoxY + 75);
  doc.setFont("helvetica", "normal");
  doc.text("19AAPCC5623A1ZL", leftBoxX + 110, topBoxY + 75);

  // Invoice Info (right side inside box)
  doc.setFont("helvetica", "bold");
  doc.text("Invoice No.:", pageWidth - 200, topBoxY + 15);
  doc.setFont("helvetica", "normal");
  doc.text("003", pageWidth - 110, topBoxY + 15);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", pageWidth - 200, topBoxY + 30);
  doc.setFont("helvetica", "normal");
  doc.text("03-Oct-23", pageWidth - 110, topBoxY + 30);

  // --- Items Table ---
  const tableData = selectedRows.map((row, i) => [
    i + 1,
    row.original.sku || "",
    row.original.productName || "",
    row.original.id,
    row.original.quantity || 1,
   row.original.price || 0,
   row.original.price || 0,
  ]);

  autoTable(doc, {
    startY: topBoxY + 90,
    head: [["S. No.", "SKU", "Product Description", "Order No", "Qty", "Price", "Total"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    styles: { fontSize: 9, cellPadding: 3, valign: "middle" },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 80 },
      2: { cellWidth: 180 },
      3: { cellWidth: 70 },
      4: { cellWidth: 40 },
      5: { cellWidth: 60, halign: "right" },
      6: { cellWidth: 60, halign: "right" },
    },
  });

  // --- Totals ---
  const totalAmount = tableData.reduce((sum, r) => sum + parseFloat(r[6]), 0);
  let y = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.text("Total", pageWidth - 120, y);
  doc.text(totalAmount.toFixed(2), pageWidth - 50, y, { align: "right" });
  y += 15;
  doc.text("Discount", pageWidth - 120, y);
  doc.text("-", pageWidth - 50, y, { align: "right" });
  y += 15;
  doc.text("Round Off", pageWidth - 120, y);
  doc.text("-", pageWidth - 50, y, { align: "right" });
  y += 15;
  doc.text("Grand Total", pageWidth - 120, y);
  doc.text(totalAmount.toFixed(2), pageWidth - 50, y, { align: "right" });

  // --- Bank Details ---
  y += 40;
  doc.setFont("helvetica", "bold");
  doc.text(`Rs. In Words: ${totalAmount.toFixed(2)} only`, leftBoxX, y);
  y += 15;
  doc.text("Bank Details:", leftBoxX, y);
  doc.setFont("helvetica", "normal");
  doc.text("A/c Name: Example Brand", leftBoxX, y + 15);
  doc.text("A/c Number: 0000000000", leftBoxX, y + 30);
  doc.text("Bank Name: ICICI Bank Ltd", leftBoxX, y + 45);
  doc.text("IFSC Code: ICIC000000", leftBoxX, y + 60);

  // --- Signature ---
  doc.setFont("helvetica", "bold");
  doc.text("For Example Brand", pageWidth - 180, y);
  doc.setFont("helvetica", "normal");
  doc.text("Authorised Signatory", pageWidth - 180, y + 60);

  // --- Footer ---
  doc.setTextColor(255, 0, 0).setFontSize(10);
  doc.text("Thank you for shopping with us!", pageWidth / 2, 800, { align: "center" });

  doc.save(`brand_invoice_${new Date().toISOString().split("T")[0]}.pdf`);
};

    if (isLoading) {
        return <div className="p-4">Loading orders...</div>;
    }

    if (error) {
        return (
            <div className="text-red-500 p-4">
                Error loading orders: {error.message}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="w-full md:w-auto">
                    <Input
                        placeholder="Search by order id..."
                        value={
                            (table
                                .getColumn("id")
                                ?.getFilterValue() as string) ?? search
                        }
                        onChange={(event) => {
                            table
                                .getColumn("id")
                                ?.setFilterValue(event.target.value);
                            setSearch(event.target.value);
                        }}
                    />
                      {/* Date range filter */}
                               <Input
                    type="date"
                    value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                    className="border rounded px-2 py-1"
                />
                <span>to</span>
                <Input
                    type="date"
                    value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                    className="border rounded px-2 py-1"
                />

                                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full md:w-48">
                                {brandIds.length > 0
                                    ? `${brandIds.length} brand(s) selected`
                                    : "Filter by brands..."}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="max-h-80 w-60 overflow-y-auto">
                            {brandsData?.data?.map((brand) => (
                                <DropdownMenuItem
                                    key={brand.id}
                                    asChild
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={brandIds.includes(brand.id)}
                                            onCheckedChange={(checked) => {
                                                const newBrandIds = checked
                                                    ? [...brandIds, brand.id]
                                                    : brandIds.filter((id) => id !== brand.id);
                                                setBrandIds(newBrandIds);
                                                if (newBrandIds.length > 0) {
                                                    setBrandFilter("all");
                                                }
                                            }}
                                        />
                                        <span
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const newBrandIds = brandIds.includes(brand.id)
                                                    ? brandIds.filter((id) => id !== brand.id)
                                                    : [...brandIds, brand.id];
                                                setBrandIds(newBrandIds);
                                                if (newBrandIds.length > 0) {
                                                    setBrandFilter("all");
                                                }
                                            }}
                                        >
                                            {brand.name}
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Button
                    onClick={handleDownloadPDF}
                    disabled={Object.keys(rowSelection).length === 0}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                    Download Selected Invoices
                </Button>
                <Button
  onClick={handleDownloadBrandPDF}
  disabled={Object.keys(rowSelection).length === 0}
  className="bg-green-500 hover:bg-green-600 text-white"
>
  Download Brand Invoice
</Button>

                <DataTableViewOptions table={table} />
            </div>

            <DataTable
                columns={columns(refetchOrderData)}
                table={table}
                pages={pages}
                count={count}
            />
        </div>
    );
}