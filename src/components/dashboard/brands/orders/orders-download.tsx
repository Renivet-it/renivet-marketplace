"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import { convertPaiseToRupees, convertValueToLabel } from "@/lib/utils";
import { OrderWithItemAndBrand } from "@/lib/validations";
import { unparse } from "papaparse";
import { toast } from "sonner";

interface PageProps {
    orders: OrderWithItemAndBrand[];
    brandId: string;
}

export function BrandOrdersDownload({ orders, brandId }: PageProps) {
    const handleDownload = () => {
        try {
            // Filter order items to only include items from this brand
            const csvData = orders.flatMap((order) =>
                order.items
                    .filter((item) => item.product.brand.id === brandId)
                    .map((item) => ({
                        "Order ID": order.id,
                        "Receipt ID": order.receiptId,
                        "Order Date": new Date(
                            order.createdAt
                        ).toLocaleDateString(),
                        "Order Status": convertValueToLabel(order.status),
                        "Payment Status": convertValueToLabel(
                            order.paymentStatus
                        ),
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
                                          `${
                                              item.product.options.find(
                                                  (o) => o.id === key
                                              )?.name
                                          }: ${
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
                            order.shipments.find((s) => s.brandId === brandId)
                                ?.status || "pending"
                        ),
                        "AWB Number":
                            order.shipments.find((s) => s.brandId === brandId)
                                ?.awbNumber || "",
                        "Invoice URL":
                            order.shipments.find((s) => s.brandId === brandId)
                                ?.invoiceUrl || "",
                        "Manifest URL":
                            order.shipments.find((s) => s.brandId === brandId)
                                ?.manifestUrl || "",
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
                "brand-orders",
                brandId,
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
        <Button
            variant="outline"
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-md px-4 py-2"
        >
            <Icons.Download className="h-4 w-4" />
            <span>Export Orders</span>
        </Button>
    );
}
