"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableViewOptions } from "@/components/ui/data-table-dash";
import { DataTable } from "@/components/ui/data-table-order";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input-dash";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select-dash";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import {
    CachedBrand,
    OrderWithItemAndBrand,
    ProductWithBrand,
} from "@/lib/validations";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ChevronDown } from "lucide-react";
import {
    parseAsArrayOf,
    parseAsInteger,
    parseAsIsoDate,
    parseAsString,
    parseAsStringLiteral,
    useQueryState,
} from "nuqs";
import { useMemo, useState } from "react";
import { OrderAction } from "./order-action";
import { OrderSingle } from "./order-single";

// Status tab configuration
const STATUS_TABS = [
    { value: "all", label: "All Orders" },
    { value: "ready_to_pickup", label: "Ready to Pickup" },
    { value: "pickup_scheduled", label: "Pickup Scheduled" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "rto", label: "RTO" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["value"];

export type TableOrder = OrderWithItemAndBrand;

const columns = (onAction: () => void): ColumnDef<TableOrder>[] => [
    {
        id: "select",
        header: ({ table }) => (
            <input
                type="checkbox"
                checked={table.getIsAllPageRowsSelected()}
                onChange={(e) =>
                    table.toggleAllPageRowsSelected(e.target.checked)
                }
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
    const [page, setPage] = useQueryState(
        "page",
        parseAsInteger.withDefault(1)
    );
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
    const [perPage, setPerPage] = useQueryState(
        "perPage",
        parseAsInteger.withDefault(10)
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
    const [statusTab, setStatusTab] = useQueryState(
        "statusTab",
        parseAsStringLiteral([
            "all",
            "ready_to_pickup",
            "pickup_scheduled",
            "shipped",
            "delivered",
            "cancelled",
            "rto",
        ]).withDefault("all")
    );
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {}
    );
    const [rowSelection, setRowSelection] = useState({});
    // Add a new query specifically for PDF generation
    const { data: allFilteredOrders } = trpc.general.orders.getOrders.useQuery(
        {
            page: 1,
            limit: 1000000, // Large enough to get all filtered records
            search,
            brandIds: brandIds.length > 0 ? brandIds : undefined,
            startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
            endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
            statusTab: statusTab as StatusTab,
        },
        {
            enabled: false, // Don't fetch by default, only when needed
            refetchOnWindowFocus: false,
        }
    );
    const {
        data: { data: dataRaw, count },
        refetch: refetchOrderData,
        isLoading,
        error,
    } = trpc.general.orders.getOrders.useQuery(
        {
            page,
            limit: perPage,
            search,
            brandIds: brandIds.length > 0 ? brandIds : undefined,
            startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
            endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
            statusTab: statusTab as StatusTab,
        },
        {
            initialData,
            keepPreviousData: true, // Smoother transitions
            // Disable automatic refetching
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        }
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
    const isBrandSelected = brandIds.length > 0;
    const pages = useMemo(() => Math.ceil(count / limit) ?? 1, [count, limit]);

    const table = useReactTable({
        data,
        columns: columns(refetchOrderData),
        getCoreRowModel: getCoreRowModel(),
        // getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        pageCount: pages,
        manualPagination: true, // Enable manual pagination
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex: page - 1, // Convert to 0-based index
                pageSize: perPage,
            },
        },
    });
    // State declarations
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [utrNumber, setUtrNumber] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [selectedBrandId, setSelectedBrandId] = useState(""); // Selected brand ID from dialog
    const [allFilteredData, setAllFilteredData] = useState<TableOrder[]>([]);
    const [applyShipmentFlag, setApplyShipmentFlag] = useState(false);

    // Modified handleDownloadPDF function
    const handleDownloadPDF = async () => {
        // Check if any rows are selected
        const selectedRows = table.getSelectedRowModel().rows;

        let dataToUse: TableOrder[];

        if (selectedRows.length > 0) {
            // Use selected rows
            dataToUse = selectedRows.map((row) => row.original);
        } else {
            // Fetch ALL filtered data (not just current page)
            const { data: allData } = await refetchOrderData({
                page: 1,
                limit: 1000, // Get all records that match current filters
                search,
                brandIds: brandIds.length > 0 ? brandIds : undefined,
                startDate: startDate
                    ? format(startDate, "yyyy-MM-dd")
                    : undefined,
                endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
            });
            dataToUse = allData.data;
        }

        // Now use dataToUse for PDF generation
        setIsModalOpen(true);
        // Store data for PDF generation
        setAllFilteredData(dataToUse);
    };
    const formatDate = (date) => {
        if (!date) return "N/A";
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };
    const generatePDF = (logoBase64: string | ArrayBuffer | null) => {
        const selectedRows = table.getSelectedRowModel().rows;
        const dataToUse = allFilteredData || data;
        // Find the selected brand from the dialog
        // const selectedBrand = brandsData?.data?.find((brand) => brand.id === selectedBrandId);
        let selectedBrand: CachedBrand | undefined;

        if (brandIds.length === 1) {
            // Use the brand from the main filter
            selectedBrand = brandsData?.data?.find(
                (brand) => brand.id === brandIds[0]
            );
        } else {
            // Fall back to dialog selection
            selectedBrand = brandsData?.data?.find(
                (brand) => brand.id === selectedBrandId
            );
        }

        if (!selectedBrand) {
            setIsErrorModalOpen(true);
            return;
        }
        if (!selectedBrand) {
            setIsErrorModalOpen(true);
            return;
        }
        // Totals
        const totalGrossSale = dataToUse.reduce(
            (sum, order) => sum + +convertPaiseToRupees(order.totalAmount),
            0
        );
        const commissionRate = 0.25;
        const gstRate = 0.18;
        const tcsRate = 0.01;
        const paymentGatewayFee = dataToUse.reduce(
            (sum, order) =>
                sum +
                +convertPaiseToRupees(
                    order.totalAmount * 0.02 > 2000
                        ? order.totalAmount * 0.02
                        : 2000
                ),
            0
        );

        const shippingFee = dataToUse.reduce(
            (sum, order) =>
                sum +
                +(
                    order?.shipments?.[0]?.awbDetailsShipRocketJson?.response
                        ?.data?.freight_charges || 0
                ),
            0
        );
        const shippingFeeInPaise = shippingFee * 100;
        const commission = dataToUse.reduce(
            (sum, order) =>
                sum +
                +convertPaiseToRupees(
                    ((order.items[0]?.product?.category?.commissionRate || 0) /
                        100) *
                        order.totalAmount
                ),
            0
        );
        const gstOnCommission = commission * gstRate;
        const tcs = totalGrossSale * tcsRate;
        const totalDeductions =
            commission +
            gstOnCommission +
            tcs +
            paymentGatewayFee +
            shippingFee;
        const finalPayable = totalGrossSale - totalDeductions;

        // Create PDF
        const doc = new jsPDF();

        // Title
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Renivet Commission Invoice", 105, 15, { align: "center" });

        // Seller details (Renivet)
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("Renivet Sustainable Marketplace", 14, 30);
        doc.text("GSTIN: 29ABCDE1234F1Z5", 14, 36);
        doc.text("Email: finance@renivet.com", 14, 42);

        // Buyer details (Selected Brand)
        doc.text(`Invoice To: ${selectedBrand.name}`, 140, 30);
        doc.text(
            `GSTIN: ${selectedBrand.confidential?.gstin ?? "N/A"}`,
            140,
            36
        );
        doc.text(
            `Period:  ${formatDate(startDate)} to  ${formatDate(endDate)}`,
            140,
            42
        );

        autoTable(doc, {
            startY: 55,
            styles: {
                fontSize: 11,
                cellPadding: 3,
                overflow: "linebreak",
                halign: "left",
            },
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
            body: [
                ["Gross Sale Value (Incl. GST)", totalGrossSale.toFixed(2)],
                ["Commission Amount", commission.toFixed(2)],
                ["GST on Commission @18%", gstOnCommission.toFixed(2)],
                ["TCS @1% on Net MRP", tcs.toFixed(2)],
                ["Payment Gateway Fee", paymentGatewayFee.toFixed(2)],
                ["Shipping Fee", shippingFee.toFixed(2)],
                ["Total Deductions", totalDeductions.toFixed(2)],
                ["Final Payable to Brand", finalPayable.toFixed(2)],
                ["UTR Number", utrNumber || "N/A"],
                ["Payment Date", paymentDate || "N/A"],
            ],
            theme: "grid",
            columnStyles: {
                0: { cellWidth: 100, halign: "left" },
                1: { cellWidth: 80, halign: "right" },
            },
            didParseCell: (data) => {
                if (data.row.index === 6) {
                    data.cell.styles.fillColor = [240, 240, 240];
                }
            },
        });

        doc.save(
            `consolidated_invoice_${new Date().toISOString().split("T")[0]}.pdf`
        );
        setIsModalOpen(false); // Close modal after PDF generation
        setUtrNumber("");
        setPaymentDate("");
        setSelectedBrandId(""); // Reset brand selection
    };

    const handleDownloadBrandPDF = async () => {
        // Fetch ALL filtered data if no rows are selected
        let dataToUse = table
            .getSelectedRowModel()
            .rows.map((row) => row.original);
        if (dataToUse.length === 0) {
            const { data: allData } = await refetchOrderData({
                page: 1,
                limit: 1000,
                search,
                brandIds: brandIds.length > 0 ? brandIds : undefined,
                startDate: startDate
                    ? format(startDate, "yyyy-MM-dd")
                    : undefined,
                endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
            });
            dataToUse = allData?.data ?? [];
        }

        const logoUrl =
            "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNQAASEtvbyYEoZ78eJzNIKWdcxq1Of9wlHtAT";
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const today = new Date();
        const formattedDate = today
            .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
            })
            .replace(/ /g, "-");

        const firstOrder = dataToUse[0];

        // --- Header ---
        doc.addImage(logoUrl, "PNG", 40, 40, 120, 120);
        doc.setFont("helvetica", "bold").setFontSize(14);
        doc.text("INVOICE", pageWidth / 2, 50, { align: "center" });

        // --- Company Info ---
        doc.setFontSize(10).setFont("helvetica", "normal");
        doc.text("Renivet Solution", pageWidth - 200, 70);
        doc.text("Kolte Patil Itowers,", pageWidth - 200, 85);
        doc.text("Karnataka - 560100.", pageWidth - 200, 100);
        doc.text("Email: support@renivet.com", pageWidth - 200, 115);
        doc.text("ph: 8983676772", pageWidth - 200, 130);

        // --- Customer & Invoice Details Box ---
        const leftBoxX = 40;
        const topBoxY = 150;
        const boxWidth = pageWidth - 80;
        const boxHeight = 100; // Increased height for address

        doc.rect(leftBoxX, topBoxY, boxWidth, boxHeight);

        // Customer Name
        doc.setFont("helvetica", "bold");
        doc.text("Customer Name:", leftBoxX + 5, topBoxY + 15);
        doc.setFont("helvetica", "normal");
        doc.text(
            firstOrder?.items?.[0]?.product?.brand?.confidential
                ?.authorizedSignatoryName ?? "N/A",
            leftBoxX + 110,
            topBoxY + 15
        );

        // Address - with proper line wrapping
        doc.setFont("helvetica", "bold");
        doc.text("Address:", leftBoxX + 5, topBoxY + 30);
        doc.setFont("helvetica", "normal");

        const addressParts = [
            firstOrder?.items?.[0]?.product?.brand?.confidential
                ?.warehouseAddressLine1 || "",
            firstOrder?.items?.[0]?.product?.brand?.confidential
                ?.warehouseAddressLine2 || "",
            firstOrder?.items?.[0]?.product?.brand?.confidential
                ?.warehousePostalCode
                ? `ZIP: ${firstOrder.items[0].product.brand.confidential.warehousePostalCode}`
                : "",
        ].filter((line) => line.trim().length > 0);

        // Print each address part on a new line
        addressParts.forEach((part, index) => {
            doc.text(part, leftBoxX + 110, topBoxY + 30 + index * 12);
        });

        // Phone Number (position adjusted based on address lines)
        const phoneY = topBoxY + 30 + addressParts.length * 12 + 10;
        doc.setFont("helvetica", "bold");
        doc.text("Phone Number:", leftBoxX + 5, phoneY);
        doc.setFont("helvetica", "normal");
        doc.text(
            firstOrder?.items?.[0]?.product?.brand?.phone || "N/A",
            leftBoxX + 110,
            phoneY
        );

        // GSTIN (position adjusted)
        doc.setFont("helvetica", "bold");
        doc.text("GSTIN No.:", leftBoxX + 5, phoneY + 20);
        doc.setFont("helvetica", "normal");
        doc.text(
            firstOrder?.items?.[0]?.product?.brand?.confidential?.gstin ??
                "N/A",
            leftBoxX + 110,
            phoneY + 20
        );

        // Invoice Info (right side)
        doc.setFont("helvetica", "bold");
        doc.text("Invoice No.:", pageWidth - 200, topBoxY + 15);
        doc.setFont("helvetica", "normal");
        doc.text("01", pageWidth - 110, topBoxY + 15);

        doc.setFont("helvetica", "bold");
        doc.text("Date:", pageWidth - 200, topBoxY + 30);
        doc.setFont("helvetica", "normal");
        doc.text(formattedDate, pageWidth - 110, topBoxY + 30);

        // --- Items Table ---
        const tableData = dataToUse.map((row, i) => {
            let commissionRate =
                row.items[0]?.product?.category?.commissionRate || 0;
            // Apply 5% adjustment if flag is set
            if (applyShipmentFlag) {
                commissionRate += 5; // Increase commission by 5%
            }

            // const commissionRateValue = (row.items[0]?.product?.category?.commissionRate || 0) / 100 * row.totalAmount;
            const commissionRateValue =
                (commissionRate / 100) * row.totalAmount;
            // const shippingFeeInRupees = row?.shipments?.[0]?.awbDetailsShipRocketJson?.response?.data?.freight_charges || 0;
            const shippingFeeInRupees = applyShipmentFlag
                ? 0
                : row?.shipments?.[0]?.awbDetailsShipRocketJson?.response?.data
                      ?.freight_charges || 0;
            const totaldeduction = convertPaiseToRupees(
                commissionRateValue +
                    commissionRateValue * 0.18 +
                    row.totalAmount * 0.01 +
                    shippingFeeInRupees * 100 +
                    (row.totalAmount * 0.02 > 2000
                        ? row.totalAmount * 0.02
                        : 2000)
            );

            return [
                (i + 1).toString(),
                row.items[0].product.sku || "",
                row.items[0].product.title || "",
                row.id,
                (row.totalItems || 1).toString(),
                convertPaiseToRupees(row.totalAmount * 0.82 || 0),
                convertPaiseToRupees(row.totalAmount || 0),
                commissionRate,
                convertPaiseToRupees(commissionRateValue),
                convertPaiseToRupees(commissionRateValue * 0.18),
                convertPaiseToRupees(row.totalAmount * 0.01),
                shippingFeeInRupees,
                convertPaiseToRupees(
                    row.totalAmount * 0.02 > 2000
                        ? row.totalAmount * 0.02
                        : 2000
                ),
                totaldeduction,
                (
                    Number(convertPaiseToRupees(row.totalAmount)) -
                    Number(totaldeduction || 0)
                ).toFixed(2),
            ];
        });

        // Start table below the customer box with some margin
        autoTable(doc, {
            startY: phoneY + 50,
            head: [
                [
                    "S. No",
                    "SKU",
                    "Product",
                    "Order No",
                    "Qty",
                    "Gross",
                    "Net",
                    "Comm %",
                    "Comm Amt",
                    "Comm GST",
                    "TCS",
                    "Ship Amt",
                    "Gateway Fee",
                    "Total Ded",
                    "Final Pay",
                ],
            ],
            body: tableData,
            theme: "grid",
            headStyles: {
                fillColor: [80, 80, 80],
                textColor: 255,
                fontSize: 8,
                halign: "center",
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: "linebreak",
            },
            columnStyles: {
                0: { cellWidth: 18, halign: "center" },
                1: { cellWidth: 40, halign: "center" },
                2: { cellWidth: 70, halign: "left" },
                3: { cellWidth: 50, halign: "center" },
                4: { cellWidth: 18, halign: "center" },
                5: { cellWidth: 35, halign: "right" },
                6: { cellWidth: 35, halign: "right" },
                7: { cellWidth: 22, halign: "center" },
                8: { cellWidth: 35, halign: "right" },
                9: { cellWidth: 35, halign: "right" },
                10: { cellWidth: 28, halign: "right" },
                11: { cellWidth: 35, halign: "right" },
                12: { cellWidth: 38, halign: "right" },
                13: { cellWidth: 35, halign: "right" },
                14: { cellWidth: 35, halign: "right" },
            },
        });
        // --- Totals Section ---
        let y = doc.lastAutoTable.finalY + 20;
        const totals = [
            [
                "Total",
                tableData
                    .reduce((sum, r) => sum + parseFloat(r[14] || 0), 0)
                    .toFixed(2),
            ],
            ["Discount", "-"],
            ["Round Off", "-"],
            [
                "Grand Total",
                tableData
                    .reduce((sum, r) => sum + parseFloat(r[14] || 0), 0)
                    .toFixed(2),
            ],
        ];

        totals.forEach(([label, value], index) => {
            doc.setFont(
                "helvetica",
                index === totals.length - 1 ? "bold" : "normal"
            );
            if (index === totals.length - 1) {
                doc.setFillColor(230, 230, 230);
                doc.rect(pageWidth - 180, y - 10, 140, 18, "F");
            }
            doc.text(label, pageWidth - 180, y);
            doc.text(value.toString(), pageWidth - 50, y, { align: "right" });
            y += 15;
        });

        // --- Bank Details ---
        y += 25;
        doc.setFont("helvetica", "bold");
        // doc.text(`Rs. In Words: ${totals[3][1]}`, leftBoxX, y);
        y += 15;
        // doc.text("Bank Details:", leftBoxX, y);
        // doc.setFont("helvetica", "normal");
        // doc.text("A/c Name: Nanhey", leftBoxX, y + 15);
        // doc.text("A/c Number: 03720500561", leftBoxX, y + 30);
        // doc.text("Bank Name: ICICI Bank Ltd", leftBoxX, y + 45);
        // doc.text("IFSC Code: ICIC0000372", leftBoxX, y + 60);

        // --- Signature ---
        doc.setFont("helvetica", "bold");
        doc.text("", pageWidth - 180, y);
        doc.line(pageWidth - 180, y + 10, pageWidth - 100, y + 10);
        doc.setFont("helvetica", "normal");
        doc.text("Authorised Signatory", pageWidth - 180, y + 30);

        // --- Footer ---
        doc.setTextColor(255, 0, 0).setFontSize(10);
        doc.text(
            "Thank you for shopping with us!",
            pageWidth / 2,
            pageHeight - 40,
            { align: "center" }
        );

        // Save the PDF
        doc.save(`brand_invoice_${new Date().toISOString().split("T")[0]}.pdf`);
    };
    return (
        <div className="space-y-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            {/* Status Tabs */}
            <div className="border-b border-gray-200">
                <Tabs
                    value={statusTab}
                    onValueChange={(value) => {
                        setStatusTab(value as StatusTab);
                        setPage(1); // Reset to first page when switching tabs
                    }}
                    className="w-full"
                >
                    <TabsList className="flex h-auto flex-wrap gap-0 border-none bg-transparent p-0">
                        {STATUS_TABS.map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className={cn(
                                    "relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium",
                                    "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary",
                                    "hover:bg-gray-50 hover:text-gray-700 data-[state=inactive]:text-gray-500",
                                    "transition-all duration-200"
                                )}
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            {/* Filter & Actions Section */}
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                {/* Filters Group */}
                <div className="flex flex-wrap items-end gap-4">
                    {/* Search Input */}
                    <div className="min-w-[240px]">
                        <Input
                            placeholder="Search by order ID..."
                            className="w-full"
                            value={search}
                            onChange={(e) => {
                                table
                                    .getColumn("id")
                                    ?.setFilterValue(e.target.value);
                                setSearch(e.target.value);
                            }}
                        />
                    </div>
                    {/* Date Range */}
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end">
                        <div className="flex items-center gap-2">
                            <div className="w-[160px]">
                                <div
                                    htmlFor="start-date"
                                    className="text-sm font-medium text-gray-600"
                                >
                                    Start Date
                                </div>
                                <Input
                                    id="start-date"
                                    type="date"
                                    className="mt-1 w-full"
                                    value={
                                        startDate
                                            ? format(startDate, "yyyy-MM-dd")
                                            : ""
                                    }
                                    onChange={(e) =>
                                        setStartDate(
                                            e.target.value
                                                ? new Date(e.target.value)
                                                : null
                                        )
                                    }
                                />
                            </div>
                            <span className="mb-1 hidden text-gray-400 sm:block">
                                -
                            </span>
                        </div>
                        <div className="w-[160px]">
                            <div
                                htmlFor="end-date"
                                className="text-sm font-medium text-gray-600"
                            >
                                End Date
                            </div>
                            <Input
                                id="end-date"
                                type="date"
                                className="mt-1 w-full"
                                value={
                                    endDate ? format(endDate, "yyyy-MM-dd") : ""
                                }
                                onChange={(e) =>
                                    setEndDate(
                                        e.target.value
                                            ? new Date(e.target.value)
                                            : null
                                    )
                                }
                            />
                        </div>
                    </div>
                    {/* Brand Filter */}
                    <div className="min-w-[240px]">
                        <div className="mb-1 block text-sm font-medium text-gray-600">
                            Brand Filter
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between"
                                >
                                    {brandIds.length > 0
                                        ? `${brandIds.length} brand(s) selected`
                                        : "Select brands"}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="max-h-[280px] w-[240px] overflow-y-auto">
                                {brandsData?.data?.map((brand) => (
                                    <DropdownMenuItem
                                        key={brand.id}
                                        onSelect={(e) => e.preventDefault()}
                                        className="flex items-center gap-3"
                                    >
                                        <Checkbox
                                            checked={brandIds.includes(
                                                brand.id
                                            )}
                                            onCheckedChange={(checked) => {
                                                const updated = checked
                                                    ? [...brandIds, brand.id]
                                                    : brandIds.filter(
                                                          (id) =>
                                                              id !== brand.id
                                                      );
                                                setBrandIds(updated);
                                                if (updated.length > 0)
                                                    setBrandFilter("all");
                                            }}
                                        />
                                        <span className="text-sm">
                                            {brand.name}
                                        </span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                        <Checkbox
                            id="shipment-flag"
                            checked={applyShipmentFlag}
                            onCheckedChange={(checked) =>
                                setApplyShipmentFlag(Boolean(checked))
                            }
                        />
                        <Label
                            htmlFor="shipment-flag"
                            className="text-sm font-medium"
                        >
                            Apply 5% Shipment Adjustment
                        </Label>
                    </div>
                </div>

                {/* Actions Group */}
                <div className="flex flex-wrap gap-3">
                    <Button
                        onClick={handleDownloadPDF}
                        className="min-w-[180px]"
                        disabled={!isBrandSelected}
                    >
                        Download Consolidated Report
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={handleDownloadBrandPDF}
                        className="min-w-[180px]"
                        disabled={!isBrandSelected}
                    >
                        Download Brand Invoice
                    </Button>
                    <DataTableViewOptions table={table} />
                </div>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enter Payment Details</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="brand" className="text-right">
          Brand:
        </Label>
        <Select
          value={selectedBrandId}
          onValueChange={setSelectedBrandId}
          className="col-span-3"
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a brand" />
          </SelectTrigger>
          <SelectContent>
            {brandsData?.data?.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name} (GSTIN: {brand.gstId})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div> */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="utr" className="text-right">
                                UTR Number:
                            </Label>
                            <Input
                                id="utr"
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="paymentDate" className="text-right">
                                Payment Date (e.g., DD-MMM-YYYY):
                            </Label>
                            <Input
                                id="paymentDate"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={generatePDF}>Submit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Table Section */}
            <div className="overflow-hidden rounded-lg border">
                <DataTable
                    columns={columns(refetchOrderData)}
                    table={table}
                    pages={pages}
                    count={count}
                    perPage={perPage}
                    onPerPageChange={(value) => {
                        setPerPage(value);
                        setPage(1); // Reset to first page when changing page size
                    }}
                />
            </div>
        </div>
    );
}
