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
    const {
        data: orderShipmentDetails,
        refetch: refetchOrderShipmentDetails
    } = trpc.general.orders.getOrderShipmentDetailsByShipmentId.useQuery(
        {
            shipmentId: order.shipments?.[0]?.shiprocketShipmentId
                ? Number(order.shipments[0].shiprocketShipmentId)
                : 0,
        },
        {
            enabled: !!order.shipments?.[0]?.shiprocketShipmentId,
        }
    );

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
                downloadFile(response.invoiceUrl, `invoice_${order.shipments[0].shiprocketOrderId}.pdf`);
                toast.success("Invoice download started");
            } else if (type === "label") {
                const response = await generateLabel(order.shipments[0].shiprocketShipmentId);
                downloadFile(response.labelUrl, `label_${order.shipments[0].shiprocketShipmentId}.pdf`);
                toast.success("Label download started");
            } else if (type === "manifest") {
                const response = await generateManifest(order.shipments[0].shiprocketShipmentId);
                downloadFile(response.manifestUrl, `manifest_${order.shipments[0].shiprocketShipmentId}.pdf`);
                toast.success("Manifest download started");
            }
        } catch (error: any) {
            console.error(`Error downloading ${type}:`, error);
            let errorMessage = `Failed to download ${type}. Please try again.`;
            if (
                type === "manifest" &&
                (error.message?.includes("already generated") ||
                    error.message?.includes("already downloaded") ||
                    error.response?.data?.message?.includes("already generated"))
            ) {
                errorMessage = "Manifest has already been generated and can only be downloaded once.";
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        }
    };

    const downloadFile = (url: string, filename: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        {!isShipmentGenerated && (
                            <DropdownMenuItem
                                onClick={() => setIsSheetOpen(true)}
                            >
                                <Icons.Truck className="size-4" />
                                <span>Ship Now</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                            onClick={() => setIsInvoiceModalOpen(true)}
                        >
                            <Icons.FileText className="size-4" />
                            <span>Download Invoice</span>
                        </DropdownMenuItem>
                        {isAwbGenerated && (
                            <DropdownMenuItem
                                onClick={() => setIsLabelModalOpen(true)}
                            >
                                <Icons.Tag className="size-4" />
                                <span>Download Label</span>
                            </DropdownMenuItem>
                        )}
                        {isAwbGenerated && (
                            <DropdownMenuItem
                                onClick={() => setIsManifestModalOpen(true)}
                            >
                                <Icons.ClipboardList className="size-4" />
                                <span>Download Manifest</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Invoice Modal */}
            <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Invoice</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to download the invoice for this order?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</Button>
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

            {/* Label Modal */}
            <Dialog open={isLabelModalOpen} onOpenChange={setIsLabelModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Label</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to download the label for this order?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLabelModalOpen(false)}>Cancel</Button>
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

            {/* Manifest Modal */}
            <Dialog open={isManifestModalOpen} onOpenChange={setIsManifestModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Manifest</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to download the manifest for this order?
                        </DialogDescription>
                    </DialogHeader>
                    <p className={cn("text-[#FF5733]", "font-bold")}>
                        Note: You can download only once for this label.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsManifestModalOpen(false)}>Cancel</Button>
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

            {/* Shipment Component */}
            <OrderShipment
                isSheetOpen={isSheetOpen}
                setIsSheetOpen={setIsSheetOpen}
                onShipmentSuccessRefetchOrder={async () => {
                    await refetchOrderShipmentDetails();
                    setIsSheetOpen(false); // ✅ Close after success
                    onAction(); // parent refresh
                }}
                side="bottom"
                order={order}
            />
        </>
    );
}
