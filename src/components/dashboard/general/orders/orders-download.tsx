// "use client";

// import { Icons } from "@/components/icons";
// import { Button } from "@/components/ui/button-dash";
// import { convertPaiseToRupees, convertValueToLabel } from "@/lib/utils";
// import { OrderWithItemAndBrand } from "@/lib/validations";
// import { unparse } from "papaparse";
// import { toast } from "sonner";

// interface PageProps {
//     orders: OrderWithItemAndBrand[];
// }

// export function OrdersDownload({ orders }: PageProps) {
//     console.log("OrdersDownload component rendered with orders:", orders);
//     const handleDownload = () => {
//         try {
//             console.log(`Total orders: ${orders.length}`);
//             const csvData = orders.map((order) => {
//                 // For orders with multiple items, you might want to aggregate some values
//                 const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
//                 const totalPrice = order.items.reduce((sum, item) => sum + (item.product.price || 0), 0);
//                 const totalMRP = order.items.reduce((sum, item) => sum + (item.product.price || 0), 0);
//                 const netMRP = totalMRP - (totalMRP * 0.18);
// const commissionAmount = (order.items[0]?.product?.category?.commissionRate || 0) / 100 * totalMRP;
// const gstOnCommission = commissionAmount * 0.18;
//                 return {
//                     "Name": order.id || "",
//                     "Order Status": order.status || "",
//                     "Created at": order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "",
//                     "Billing Name": order.address?.fullName || "",
//                     "Lineitem_sku": order.items[0]?.product?.sku || "", // Added Lineitem_sku
//                     "Billing City": order.address?.city || "",
//                     "Billing ZIP": order.address?.zip || "",
//                     "Net MRP": convertPaiseToRupees(netMRP), // Added Net MRP(logic needed)
//                     "HSN": order.items[0]?.product?.hsCode || "",
//                     "Lineitem_name": order.items[0]?.product?.title || "", // Added Lineitem_name
//                     "Seller Register State": order.items[0]?.product?.brand?.confidential?.state || "", // need to add the seller info
//                     // "GST/TCS %": order.taxRate || "", // need to add the seller info
//                     "Billing Phone": order.address?.phone || "",
//                     "Payment Method": convertValueToLabel(order.paymentMethod || "Prepaid"),
//                     "Account No.": order.items[0]?.product?.brand.confidential?.bankAccountNumber || "", // need to add the seller info
//                     "IFSC Code": order.items[0]?.product?.brand.confidential?.bankIfscCode || "", // need to add the seller info
//                     "Bank Name": order.items[0]?.product?.brand.confidential?.bankName || "", // need to add the seller info
//                     "Beneficiary Name": order.items[0]?.product?.brand.confidential?.bankAccountHolderName || "", // need to add the seller info
//                     "SUM of COMM.%": order.items[0]?.product?.category.commissionRate || "", // need to add the commission info
//                     "SUM of COMM. Amt":  convertPaiseToRupees((order.items[0]?.product?.category?.commissionRate || 0) / 100 * totalMRP), // need to add the commission info
//                     "SUM of GST on COMM.@18%": convertPaiseToRupees(gstOnCommission), // need to add the commission info
//                     "SUM of TCS 1%": convertPaiseToRupees(netMRP * 0.01), // need to add the commission info
//                     "SUM of TDS 1%": convertPaiseToRupees(totalMRP * 0.01), // need to add the commission info
//                     "SUM of LINEITEM_QUANTITY": totalItems,
//                     "Gross Sale(Inc GST)": convertPaiseToRupees(totalPrice),
//                     "SUM of TOTAL_MRP": convertPaiseToRupees(totalMRP),
//                     "SUM of DISCOUNT_AMOUNT": convertPaiseToRupees(order.discountAmount || 0),
//                     "SUM of SHIPPING": order?.shipments?.[0]?.awbDetailsShipRocketJson?.response?.data?.freight_charges ?? 0,
//                     // "SUM of TAX": convertPaiseToRupees(order.taxAmount || 0),
//                     // "SUM of TAXABLE VALUE": convertPaiseToRupees((order.totalAmount || 0) - (order.taxAmount || 0)),
// "SUM of Payment to Seller": convertPaiseToRupees(
//   (totalMRP ?? 0) === 0
//     ? 0
//     : (order?.totalAmount ?? 0) -
//       ((order?.items?.[0]?.product?.category?.commissionRate ?? 0) / 100 * (totalMRP ?? 0)) -
//       ((order?.shipments?.[0]?.awbDetailsShipRocketJson?.response?.data?.freight_charges ?? 0) * 100)
// ),
//                 };
//             });

//             console.log(`Total rows in CSV data: ${csvData.length}`);

//             const csv = unparse(csvData, {
//                 quotes: true,
//                 header: true,
//             });

//             const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//             const link = document.createElement("a");
//             link.href = URL.createObjectURL(blob);
//             link.download = [
//                 "renivet",
//                 "orders",
//                 "export",
//                 new Date().toISOString().split("T")[0],
//                 ".csv",
//             ].join("_");
//             link.click();
//             URL.revokeObjectURL(link.href);

//             toast.success(`Exported ${csvData.length} orders successfully`);
//         } catch (error) {
//             toast.error("Failed to export orders");
//             console.error("Export error:", error);
//         }
//     };

//     return (
//         <Button size="icon" variant="outline" onClick={handleDownload}>
//             <Icons.Download />
//             <span className="sr-only">Export Orders</span>
//         </Button>
//     );
// }

"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { convertPaiseToRupees, convertValueToLabel } from "@/lib/utils";
import { OrderWithItemAndBrand } from "@/lib/validations";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface PageProps {
    orders: OrderWithItemAndBrand[];
}

export function OrdersDownload({ orders }: PageProps) {
    console.log("OrdersDownload component rendered with orders:", orders);
    const handleDownload = async () => {
        try {
            console.log(`Total orders: ${orders.length}`);
            // Create a new workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Orders");
            // Define columns
            worksheet.columns = [
                { header: "Order ID", key: "Name", width: 15 },
                { header: "Order Status", key: "Order Status", width: 15 },
                { header: "Created at", key: "Created at", width: 15 },
                { header: "Customer Name", key: "Customer Name", width: 20 },
                { header: "City", key: "City", width: 15 },
                { header: "ZIP", key: "ZIP", width: 15 },
                // { header: "HSN", key: "HSN", width: 15 },
                { header: "Product Name", key: "Product Name", width: 20 },
                { header: "Product Sku", key: "Product Sku", width: 15 },
                { header: "Product Category", key: "Product Category", width: 15 },
                { header: "Brand Name", key: "Brand Name", width: 15 },
                { header: "Seller State", key: "Seller State", width: 20 },
                { header: "Gross Sale(Inc GST)", key: "Gross Sale(Inc GST)", width: 20 },
                { header: "Net MRP(Excl. GST)", key: "Net MRP(Excl. GST)", width: 15 },
                // { header: "Billing Phone", key: "Billing Phone", width: 15 },
                // { header: "Payment Method", key: "Payment Method", width: 15 },
                // { header: "Account No.", key: "Account No.", width: 20 },
                // { header: "IFSC Code", key: "IFSC Code", width: 15 },
                // { header: "Bank Name", key: "Bank Name", width: 20 },
                // { header: "Beneficiary Name", key: "Beneficiary Name", width: 20 },
                { header: "Commission % (Category Based)", key: "Commission % (Category Based)", width: 15 },
                { header: "Commission Amount", key: "Commission Amount", width: 15 },
                { header: "GST on COmmission @18%", key: "GST on COmmission @18%", width: 20 },
                { header: "TCS @1% on Net MRP", key: "TCS @1% on Net MRP", width: 15 },
                // { header: "SUM of TDS 1%", key: "SUM of TDS 1%", width: 15 },
                // { header: "SUM of LINEITEM_QUANTITY", key: "SUM of LINEITEM_QUANTITY", width: 20 },

                { header: "SUM of TOTAL_MRP", key: "SUM of TOTAL_MRP", width: 15 },
                // { header: "SUM of DISCOUNT_AMOUNT", key: "SUM of DISCOUNT_AMOUNT", width: 20 },
                { header: "Shipping Fee", key: "Shipping Fee", width: 15 },
                { header: "SUM of Payment to Seller", key: "SUM of Payment to Seller", width: 20 }
            ];

            // Style the header row
            const headerRow = worksheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true };
                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFD3D3D3" } // light gray background
                };
            });

            // Add data rows
            orders.forEach((order) => {
                const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                const totalPrice = order.items.reduce((sum, item) => sum + (item.product.price || 0), 0);
                const totalMRP = order.items.reduce((sum, item) => sum + (item.product.price || 0), 0);
                const netMRP = totalMRP - (totalMRP * 0.18);
                const commissionAmount = (order.items[0]?.product?.category?.commissionRate || 0) / 100 * totalMRP;
                const gstOnCommission = commissionAmount * 0.18;

                worksheet.addRow({
                    "Name": order.id || "",
                    "Order Status": order.status || "",
                    "Created at": order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "",
                    "Customer Name": order.address?.fullName || "",
                    "City": order.address?.city || "",
                    "ZIP": order.address?.zip || "",
                    "Net MRP": convertPaiseToRupees(netMRP),
                    // "HSN": order.items[0]?.product?.hsCode || "",
                    "Product Name": order.items[0]?.product?.title || "",
                    "Product Sku": order.items[0]?.product?.sku || "",
                    "Product Category": order.items[0]?.product?.category?.name || "",
                    "Brand Name": order.items[0]?.product?.brand?.name || "",
                    "Seller State": order.items[0]?.product?.brand?.confidential?.state || "",
                    // "Billing Phone": order.address?.phone || "",
                    // "Payment Method": convertValueToLabel(order.paymentMethod || "Prepaid"),
                    // "Account No.": order.items[0]?.product?.brand.confidential?.bankAccountNumber || "",
                    // "IFSC Code": order.items[0]?.product?.brand.confidential?.bankIfscCode || "",
                    // "Bank Name": order.items[0]?.product?.brand.confidential?.bankName || "",
                    // "Beneficiary Name": order.items[0]?.product?.brand.confidential?.bankAccountHolderName || "",
                    "Gross Sale(Inc GST)": convertPaiseToRupees(totalPrice),
                    "Commission % (Category Based)": order.items[0]?.product?.category.commissionRate || "",
                    "Commission Amount": convertPaiseToRupees(commissionAmount),
                    "GST on COmmission @18%": convertPaiseToRupees(gstOnCommission),
                    "TCS @ 1% on Net MRP": convertPaiseToRupees(netMRP * 0.01),
                    // "SUM of TDS 1%": convertPaiseToRupees(totalMRP * 0.01),
                    // "SUM of LINEITEM_QUANTITY": totalItems,
                    // "SUM of TOTAL_MRP": convertPaiseToRupees(totalMRP),
                    // "SUM of DISCOUNT_AMOUNT": convertPaiseToRupees(order.discountAmount || 0),
                    "Shipping Fee": order?.shipments?.[0]?.awbDetailsShipRocketJson?.response?.data?.freight_charges ?? 0,
                    "SUM of Payment to Seller": convertPaiseToRupees(
                        (totalMRP ?? 0) === 0
                            ? 0
                            : (order?.totalAmount ?? 0) -
                            ((order?.items?.[0]?.product?.category?.commissionRate ?? 0) / 100 * (totalMRP ?? 0)) -
                            ((order?.shipments?.[0]?.awbDetailsShipRocketJson?.response?.data?.freight_charges ?? 0) * 100)
                    ),
                });
            });

            // Auto-fit columns
            worksheet.columns.forEach((column) => {
                if (column.values) {
                    const lengths = column.values.map(v => v ? v.toString().length : 0);
                    const maxLength = Math.max(...lengths.filter(v => typeof v === "number"));
                    column.width = Math.min(Math.max(maxLength + 2, 10), 50); // Set min width 10, max 50
                }
            });

            // Generate Excel file
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `renivet_orders_export_${new Date().toISOString().split("T")[0]}.xlsx`);

            toast.success(`Exported ${orders.length} orders successfully`);
        } catch (error) {
            toast.error("Failed to export orders");
            console.error("Export error:", error);
        }
    };

    return (
        <Button size="icon" variant="outline" onClick={handleDownload}>
            <Icons.Download />
            <span className="sr-only">Export Orders</span>
        </Button>
    );
}