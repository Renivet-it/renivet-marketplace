"use client";

import { generateInvoice } from "@/actions/shiprocket/generate-invoice";
import { generateLabel } from "@/actions/shiprocket/generate-label";
import { generateManifest } from "@/actions/shiprocket/generate-manifest";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import OrderShipment from "./order-shipment";
import { TableOrder } from "./orders-table";

interface PageProps {
    order: TableOrder;
    onAction: () => void;
}

export function OrderAction({ order, onAction }: PageProps) {
    const { data: orderShipmentDetails } =
        trpc.general.orders.getOrderShipmentDetailsByShipmentId.useQuery({
            shipmentId: order.shipments[0].shiprocketShipmentId!,
        });
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isAwbGenerated, setIsAwbGenerated] = useState(false);
    const [isShipmentGenerated, setIsShipmentGenerated] = useState(false);

    useEffect(() => {
        if (orderShipmentDetails) {
            const awbGenerated = orderShipmentDetails.some(
                (shipment) => shipment.isAwbGenerated
            );
            const shipmentGenerated = orderShipmentDetails.some(
                (shipment) => shipment.isPickupScheduled
            );
            setIsAwbGenerated(awbGenerated);
            setIsShipmentGenerated(shipmentGenerated);
        }
    }, [orderShipmentDetails]);

    const handleDownload = async (type: "invoice" | "label" | "manifest") => {
        try {
            if (type === "invoice") {
                const response = await generateInvoice(order.shipments[0].shiprocketOrderId);
                const link = document.createElement("a");
                link.href = response.invoiceUrl;
                link.download = `invoice_${order.shipments[0].shiprocketOrderId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Invoice download started");
            } else if (type === "label") {
                const response = await generateLabel(
                    order.shipments[0].shiprocketShipmentId
                );
                const link = document.createElement("a");
                link.href = response.labelUrl;
                link.download = `label_${order.shipments[0].shiprocketShipmentId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Label download started");
            } else if (type === "manifest") {
                const response = await generateManifest(
                    order.shipments[0].shiprocketShipmentId
                );
                const link = document.createElement("a");
                link.href = response.manifestUrl;
                link.download = `manifest_${order.shipments[0].shiprocketShipmentId}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("Manifest download started");
            }
        } catch (error: any) {
            console.error(`Error downloading ${type}:`, error);
            toast.error(
                error.message || `Failed to download ${type}. Please try again.`
            );
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <Icons.MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuGroup>
                        <>
                            {!isShipmentGenerated && (
                                <DropdownMenuItem
                                    onClick={() => {
                                        // TODO: Implement ship products logic
                                        setIsSheetOpen(true);
                                    }}
                                >
                                    <Icons.Truck className="size-4" />
                                    <span>Ship These Products</span>
                                </DropdownMenuItem>
                            )}
                        </>

                        <DropdownMenuItem
                            onClick={() => setIsInvoiceModalOpen(true)}
                        >
                            <Icons.FileText className="size-4" />
                            <span>Download Invoice</span>
                        </DropdownMenuItem>

                        <>
                            {isAwbGenerated && (
                                <DropdownMenuItem
                                    onClick={() => setIsLabelModalOpen(true)}
                                >
                                    <Icons.Tag className="size-4" />
                                    <span>Download Label</span>
                                </DropdownMenuItem>
                            )}
                        </>

                        <>
                            {isAwbGenerated && (
                                <DropdownMenuItem
                                    onClick={() => setIsManifestModalOpen(true)}
                                >
                                    <Icons.ClipboardList className="size-4" />
                                    <span>Download Manifest</span>
                                </DropdownMenuItem>
                            )}
                        </>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={isInvoiceModalOpen}
                onOpenChange={setIsInvoiceModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Invoice</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to download the invoice for
                            this order?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsInvoiceModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                await handleDownload("invoice");
                                setIsInvoiceModalOpen(false);
                            }}
                        >
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLabelModalOpen} onOpenChange={setIsLabelModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Label</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to download the label for this
                            order?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsLabelModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                await handleDownload("label");
                                setIsLabelModalOpen(false);
                            }}
                        >
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isManifestModalOpen}
                onOpenChange={setIsManifestModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Manifest</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to download the manifest for
                            this order?
                        </DialogDescription>
                    </DialogHeader>
                    <div>
                        <p className={cn("text-[#FF5733]", "font-bold")}>
                            Note: You can download only once for this download
                            label.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsManifestModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                await handleDownload("manifest");
                                setIsManifestModalOpen(false);
                            }}
                        >
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* shipment component */}
            <OrderShipment
                isSheetOpen={isSheetOpen}
                setIsSheetOpen={setIsSheetOpen}
                onShipmentSuccessRefetchOrder={onAction}
                side="bottom"
                order={order}
            ></OrderShipment>
        </>
    );
}
