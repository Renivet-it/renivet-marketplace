"use client";

import { ProductOrderCard } from "@/components/globals/cards";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Separator } from "@/components/ui/separator";
import {
    convertPaiseToRupees,
    convertValueToLabel,
    formatPriceTag,
} from "@/lib/utils";
import { OrderWithItemAndBrand } from "@/lib/validations";
import { format } from "date-fns";
import { useState } from "react";

interface PageProps {
    order: OrderWithItemAndBrand;
}

export function OrderSingle({ order }: PageProps) {
    const [isOpen, setIsOpen] = useState(false);

    type OrderShipment = NonNullable<
        OrderWithItemAndBrand["shipments"]
    >[number];

    const itemsByBrand = order.items.reduce(
        (acc, item) => {
            const brandId = item.product.brand.id;
            if (!acc[brandId]) {
                acc[brandId] = {
                    brand: item.product.brand,
                    items: [],
                    shipment: order.shipments?.find(
                        (s) => s.brandId === brandId
                    ),
                };
            }
            acc[brandId].items.push(item);
            return acc;
        },
        {} as Record<
            string,
            {
                brand: (typeof order.items)[number]["product"]["brand"];
                items: typeof order.items;
                shipment?: OrderShipment;
            }
        >
    );

    return (
        <>
            <button
                className="max-w-full break-all text-left text-blue-500 hover:underline"
                onClick={() => setIsOpen(true)}
            >
                {order.id}
            </button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Order Info */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Order ID</p>
                                <p className="text-sm text-muted-foreground">
                                    {order.id}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">
                                    Customer ID
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {order.userId}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">
                                    Total Amount
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {formatPriceTag(
                                        +convertPaiseToRupees(
                                            order.totalAmount
                                        ),
                                        true
                                    )}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">
                                    Created At
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {format(new Date(order.createdAt), "PPP")}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                            <Badge variant="secondary">
                                Order Status:{" "}
                                {convertValueToLabel(order.status)}
                            </Badge>
                            <Badge variant="secondary">
                                Payment Status:{" "}
                                {convertValueToLabel(order.paymentStatus)}
                            </Badge>
                        </div>

                        <Separator />

                        {/* Items by Brand */}
                        {Object.entries(itemsByBrand).map(
                            ([brandId, { brand, items, shipment }]) => (
                                <div key={brandId} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">
                                            {brand.name}
                                        </h3>
                                        {shipment && (
                                            <Badge variant="outline">
                                                Shipment Status:{" "}
                                                {convertValueToLabel(
                                                    shipment.status
                                                )}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {items.map((item) => (
                                            <div key={item.id} className="space-y-2">
                                                <ProductOrderCard
                                                    item={item}
                                                    trackingInfo={
                                                        shipment && {
                                                            trackingNumber:
                                                                shipment.trackingNumber,
                                                            awbNumber:
                                                                shipment.awbNumber,
                                                            estimatedDelivery:
                                                                shipment.estimatedDeliveryDate,
                                                        }
                                                    }
                                                />
                                                {item.customizationRequest && (
                                                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 space-y-1">
                                                        <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                                                            ✨ Customized Request Raised:
                                                        </div>
                                                        <p className="text-amber-900 font-medium">{item.customizationRequest}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {shipment && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Icons.Truck className="size-4" />
                                            {shipment.awbNumber ? (
                                                <p>
                                                    AWB Number:{" "}
                                                    {shipment.awbNumber}
                                                </p>
                                            ) : (
                                                <span>
                                                    Preparing for shipment
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <Separator />
                                </div>
                            )
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
