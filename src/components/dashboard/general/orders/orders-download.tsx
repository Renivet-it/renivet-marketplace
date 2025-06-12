"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { convertPaiseToRupees, convertValueToLabel } from "@/lib/utils";
import { OrderWithItemAndBrand } from "@/lib/validations";
import { unparse } from "papaparse";
import { toast } from "sonner";

interface PageProps {
    orders: OrderWithItemAndBrand[];
}

export function OrdersDownload({ orders }: PageProps) {
    console.log("OrdersDownload component rendered with orders:", orders);
    const handleDownload = () => {
        try {
            console.log(`Total orders: ${orders.length}`);
            const csvData = orders.map((order) => {
                // For orders with multiple items, you might want to aggregate some values
                const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                const totalPrice = order.items.reduce((sum, item) => sum + (item.product.price || 0), 0);
                const totalMRP = order.items.reduce((sum, item) => sum + (item.product.price || 0), 0);
                const netMRP = totalMRP - (totalMRP * 0.18);
const commissionAmount = (order.items[0]?.product?.category?.commissionRate || 0) / 100 * totalMRP;
const gstOnCommission = commissionAmount * 0.18;
                return {
                    "Name": order.id || "",
                    "Order Status": order.status || "",
                    "Created at": order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "",
                    "Billing Name": order.address?.fullName || "",
                    "Lineitem_sku": order.items[0]?.product?.sku || "", // Added Lineitem_sku
                    "Billing City": order.address?.city || "",
                    "Billing ZIP": order.address?.zip || "",
                    "Net MRP": convertPaiseToRupees(netMRP), // Added Net MRP(logic needed)
                    "HSN": order.items[0]?.product?.hsCode || "",
                    "Lineitem_name": order.items[0]?.product?.title || "", // Added Lineitem_name
                    "Seller Register State": order.items[0]?.product?.brand?.confidential?.state || "", // need to add the seller info
                    // "GST/TCS %": order.taxRate || "", // need to add the seller info
                    "Billing Phone": order.address?.phone || "",
                    "Payment Method": convertValueToLabel(order.paymentMethod || "Prepaid"),
                    "Account No.": order.items[0]?.product?.brand.confidential?.bankAccountNumber || "", // need to add the seller info
                    "IFSC Code": order.items[0]?.product?.brand.confidential?.bankIfscCode || "", // need to add the seller info
                    "Bank Name": order.items[0]?.product?.brand.confidential?.bankName || "", // need to add the seller info
                    "Beneficiary Name": order.items[0]?.product?.brand.confidential?.bankAccountHolderName || "", // need to add the seller info
                    "SUM of COMM.%": order.items[0]?.product?.category.commissionRate || "", // need to add the commission info
                    "SUM of COMM. Amt":  convertPaiseToRupees((order.items[0]?.product?.category?.commissionRate || 0) / 100 * totalMRP), // need to add the commission info
                    "SUM of GST on COMM.@18%": convertPaiseToRupees(gstOnCommission), // need to add the commission info
                    "SUM of TCS 1%": convertPaiseToRupees(netMRP * 0.01), // need to add the commission info
                    "SUM of TDS 1%": convertPaiseToRupees(totalMRP * 0.01), // need to add the commission info
                    "SUM of LINEITEM_QUANTITY": totalItems,
                    "SUM of LINEITEM_PRICE": convertPaiseToRupees(totalPrice),
                    "SUM of TOTAL_MRP": convertPaiseToRupees(totalMRP),
                    "SUM of DISCOUNT_AMOUNT": convertPaiseToRupees(order.discountAmount || 0),
                    "SUM of SHIPPING": order?.shipments?.[0]?.awbDetailsShipRocketJson?.response?.data?.freight_charges ?? 0,
                    // "SUM of TAX": convertPaiseToRupees(order.taxAmount || 0),
                    // "SUM of TAXABLE VALUE": convertPaiseToRupees((order.totalAmount || 0) - (order.taxAmount || 0)),
"SUM of Payment to Seller": convertPaiseToRupees(
  (totalMRP ?? 0) === 0
    ? 0
    : (order?.totalAmount ?? 0) -
      ((order?.items?.[0]?.product?.category?.commissionRate ?? 0) / 100 * (totalMRP ?? 0)) -
      ((order?.shipments?.[0]?.awbDetailsShipRocketJson?.response?.data?.freight_charges ?? 0) * 100)
),
                };
            });

            console.log(`Total rows in CSV data: ${csvData.length}`);

            const csv = unparse(csvData, {
                quotes: true,
                header: true,
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = [
                "renivet",
                "orders",
                "export",
                new Date().toISOString().split("T")[0],
                ".csv",
            ].join("_");
            link.click();
            URL.revokeObjectURL(link.href);

            toast.success(`Exported ${csvData.length} orders successfully`);
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