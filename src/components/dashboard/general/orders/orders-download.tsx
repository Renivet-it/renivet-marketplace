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
    const handleDownload = () => {
        try {
            const csvData = orders.flatMap((order) =>
                order.items.map((item) => ({
                    "Order ID": order.id,
                    "Receipt ID": order.receiptId,
                    "Order Date": new Date(
                        order.createdAt
                    ).toLocaleDateString(),
                    "Order Status": convertValueToLabel(order.status),
                    "Payment Status": convertValueToLabel(order.paymentStatus),
                    "Payment Method": convertValueToLabel(
                        order.paymentMethod || ""
                    ),
                    "Total Amount": convertPaiseToRupees(order.totalAmount),
                    "Tax Amount": convertPaiseToRupees(order.taxAmount),
                    "Delivery Amount": convertPaiseToRupees(
                        order.deliveryAmount
                    ),
                    "Discount Amount": convertPaiseToRupees(
                        order.discountAmount
                    ),
                    "Brand Name": item.product.brand.name,
                    "Product Title": item.product.title,
                    "Product SKU": item.sku || item.product.sku || "",
                    Category: item.product.category.name,
                    Subcategory: item.product.subcategory.name,
                    "Product Type": item.product.productType.name,
                    Quantity: item.quantity,
                    "Variant Details": item.variant
                        ? Object.entries(item.variant.combinations)
                              .map(
                                  ([key, value]) =>
                                      `${item.product.options.find((o) => o.id === key)?.name}: ${
                                          item.product.options
                                              .find((o) => o.id === key)
                                              ?.values.find(
                                                  (v) => v.id === value
                                              )?.name
                                      }`
                              )
                              .join(", ")
                        : "No Variant",
                    "Shipment Status": convertValueToLabel(
                        order.shipments.find(
                            (s) => s.brandId === item.product.brand.id
                        )?.status || "pending"
                    ),
                    "AWB Number":
                        order.shipments.find(
                            (s) => s.brandId === item.product.brand.id
                        )?.awbNumber || "",
                    "Invoice URL":
                        order.shipments.find(
                            (s) => s.brandId === item.product.brand.id
                        )?.invoiceUrl || "",
                    "Manifest URL":
                        order.shipments.find(
                            (s) => s.brandId === item.product.brand.id
                        )?.manifestUrl || "",
                }))
            );

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

            toast.success("Orders exported successfully");
        } catch (error) {
            toast.error("Failed to export orders");
            console.error(error);
        }
    };

    return (
        <Button size="icon" variant="outline" onClick={handleDownload}>
            <Icons.Download />
            <span className="sr-only">Export Orders</span>
        </Button>
    );
}
