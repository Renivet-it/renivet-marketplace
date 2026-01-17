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
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { UploadCloud, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import OrderShipment from "./order-shipment";
import { TableOrder } from "./orders-table";

interface PageProps {
    order: TableOrder;
    onAction: () => void;
}

export function OrderAction({ order, onAction }: PageProps) {
    // -----------------------------
    // 1. Detect if Delhivery order
    // -----------------------------
    const isDelhivery = Boolean(order?.uploadWbn || order?.awbNumber);
    const { data: userData } = trpc.general.users.currentUser.useQuery();

    // Shiprocket shipment details
    const { data: orderShipmentDetails } =
        trpc.brands.orders.getOrderShipmentDetailsByShipmentId.useQuery(
            {
                shipmentId: order.shiprocketShipmentId
                    ? Number(order.shiprocketShipmentId)
                    : 0,
            },
            {
                enabled: !!order.shiprocketShipmentId,
            }
        );
    const { data: brandData } =
        trpc.brands.brands.getBrandWithConfidential.useQuery(
            { brandId: userData?.brand?.id ?? "" },
            { enabled: !!userData?.brand?.id }
        );
    const { data: productData } = trpc.brands.products.getProduct.useQuery({
        productId: order?.productId ?? "",
    });
    console.log(productData, "productData");
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isAwbGenerated, setIsAwbGenerated] = useState(false);
    const [isShipmentGenerated, setIsShipmentGenerated] = useState(false);

    // Shipment Image Upload State
    const [isShipmentImageModalOpen, setIsShipmentImageModalOpen] =
        useState(false);
    const [shipmentImageFile, setShipmentImageFile] = useState<File | null>(
        null
    );
    const [isUploading, setIsUploading] = useState(false);

    const { startUpload } = useUploadThing("brandMediaUploader");
    const utils = trpc.useUtils();

    const updateShipmentImage =
        trpc.brands.orders.updateShipmentImage.useMutation({
            onSuccess: () => {
                toast.success("Shipment image uploaded successfully!");
                utils.brands.orders.getOrdersByBrandId.invalidate();
                setIsShipmentImageModalOpen(false);
                setShipmentImageFile(null);
                onAction();
            },
            onError: (error) => {
                toast.error(error.message || "Failed to save shipment image");
            },
        });

    const handleShipmentImageUpload = async () => {
        if (!shipmentImageFile) {
            toast.error("Please select an image");
            return;
        }

        try {
            setIsUploading(true);
            const uploaded = await startUpload([shipmentImageFile]);

            if (!uploaded || uploaded.length === 0) {
                throw new Error("Upload failed");
            }

            await updateShipmentImage.mutateAsync({
                orderId: order.id,
                imageUrl: uploaded[0].url,
            });
        } catch (err) {
            toast.error("Failed to upload image");
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    // Detect Shiprocket statuses
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
    console.log(order, "orders");
    // ------------------------------------------------------
    // 2. DELHIVERY DOWNLOAD INVOICE
    // ------------------------------------------------------
    const downloadDelhiveryInvoice = async () => {
        try {
            const res = await fetch("/api/delhivery/invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order: {
                        id: order.id,
                        customerName: order.firstName + " " + order.lastName,
                        phone: order?.phone,
                        address:
                            order.street +
                            ", " +
                            order.city +
                            ", " +
                            order.state +
                            " - " +
                            order.zip,
                        amount: order.totalAmount,
                        items: productData,
                        brand: brandData,
                        date: order.createdAt,
                    },
                }),
            });

            if (!res.ok) {
                toast.error("Failed to download invoice");
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `invoice_${order.id}.pdf`;
            link.click();

            URL.revokeObjectURL(url);
            toast.success("Invoice downloaded!");
        } catch (err) {
            toast.error("Could not download invoice");
        }
    };

    // ------------------------------------------------------
    // 3. DELHIVERY DOWNLOAD LABEL
    // ------------------------------------------------------
    const downloadDelhiveryLabel = async () => {
        try {
            const res = await fetch("/api/delhivery/label", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wbn: order?.awbNumber,
                }),
            });

            if (!res.ok) {
                toast.error("Failed to download label");
                return;
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `label_${order.id}.pdf`;
            link.click();

            URL.revokeObjectURL(url);
            toast.success("Label downloaded!");
        } catch (err) {
            toast.error("Could not download label");
        }
    };

    // ------------------------------------------------------
    // 4. SHIPROCKET DOWNLOAD HANDLER
    // ------------------------------------------------------
    const handleDownload = async (type: "invoice" | "label" | "manifest") => {
        try {
            if (type === "invoice") {
                const response = await generateInvoice(order.shiprocketOrderId);
                const link = document.createElement("a");
                link.href = response.invoiceUrl;
                link.download = `invoice_${order.shiprocketOrderId}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else if (type === "label") {
                const response = await generateLabel(
                    order.shiprocketShipmentId
                );
                const link = document.createElement("a");
                link.href = response.labelUrl;
                link.download = `label_${order.shiprocketShipmentId}.pdf`;
                link.click();
            } else if (type === "manifest") {
                const response = await generateManifest(
                    order.shiprocketShipmentId
                );
                const manifestUrl =
                    response.manifestUrl || response.manifest_url;

                if (!manifestUrl) {
                    toast.error("Manifest already downloaded");
                    return;
                }

                const link = document.createElement("a");
                link.href = manifestUrl;
                link.download = `manifest_${order.shiprocketShipmentId}.pdf`;
                link.click();
            }
            toast.success(`${type} download started`);
        } catch (err) {
            toast.error(`Failed to download ${type}`);
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0">
                        <Icons.MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuGroup>
                        {!isShipmentGenerated &&
                            order.status !== "cancelled" &&
                            order.status !== "delivered" &&
                            order.status !== "shipped" && (
                                <DropdownMenuItem
                                    onClick={() => setIsSheetOpen(true)}
                                >
                                    <Icons.Truck className="size-4" />
                                    <span>Ship Now</span>
                                </DropdownMenuItem>
                            )}

                        {/* INVOICE */}
                        <DropdownMenuItem
                            onClick={() => setIsInvoiceModalOpen(true)}
                        >
                            <Icons.FileText className="size-4" />
                            <span>Download Invoice</span>
                        </DropdownMenuItem>

                        {/* LABEL */}
                        {isDelhivery ? (
                            <DropdownMenuItem
                                onClick={() => setIsLabelModalOpen(true)}
                            >
                                <Icons.Tag className="size-4" />
                                <span>Download Label (Delhivery)</span>
                            </DropdownMenuItem>
                        ) : (
                            isAwbGenerated && (
                                <DropdownMenuItem
                                    onClick={() => setIsLabelModalOpen(true)}
                                >
                                    <Icons.Tag className="size-4" />
                                    <span>Download Label</span>
                                </DropdownMenuItem>
                            )
                        )}

                        {/* MANIFEST (Shiprocket only) */}
                        {!isDelhivery && isAwbGenerated && (
                            <DropdownMenuItem
                                onClick={() => setIsManifestModalOpen(true)}
                            >
                                <Icons.ClipboardList className="size-4" />
                                <span>Download Manifest</span>
                            </DropdownMenuItem>
                        )}

                        {/* SHIPMENT IMAGE */}
                        {(order.status === "pending" ||
                            order.status === "processing") && (
                            <DropdownMenuItem
                                onClick={() =>
                                    setIsShipmentImageModalOpen(true)
                                }
                            >
                                <Icons.Upload className="size-4" />
                                <span>Upload Shipment Image</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* --------------------- INVOICE MODAL --------------------- */}
            <Dialog
                open={isInvoiceModalOpen}
                onOpenChange={setIsInvoiceModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Invoice</DialogTitle>
                        <DialogDescription>
                            Download invoice for this order?
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
                                if (isDelhivery)
                                    await downloadDelhiveryInvoice();
                                else await handleDownload("invoice");

                                setIsInvoiceModalOpen(false);
                            }}
                        >
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --------------------- LABEL MODAL --------------------- */}
            <Dialog open={isLabelModalOpen} onOpenChange={setIsLabelModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Label</DialogTitle>
                        <DialogDescription>
                            Download shipping label?
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
                                if (isDelhivery) await downloadDelhiveryLabel();
                                else await handleDownload("label");

                                setIsLabelModalOpen(false);
                            }}
                        >
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --------------------- MANIFEST MODAL --------------------- */}
            <Dialog
                open={isManifestModalOpen}
                onOpenChange={setIsManifestModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Manifest</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to download the manifest?
                        </DialogDescription>
                    </DialogHeader>

                    <p className={cn("font-bold text-[#FF5733]")}>
                        Note: Manifest can be downloaded only once.
                    </p>

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

            {/* --------------------- SHIPMENT IMAGE MODAL --------------------- */}
            <Dialog
                open={isShipmentImageModalOpen}
                onOpenChange={(open) => {
                    setIsShipmentImageModalOpen(open);
                    if (!open) setShipmentImageFile(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Shipment Image</DialogTitle>
                        <DialogDescription>
                            Upload a photo of the order before shipping
                            (optional)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Upload Area */}
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted p-6 text-center transition hover:bg-muted/40">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                                Click to upload or drag & drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PNG, JPG up to 8MB
                            </p>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) setShipmentImageFile(file);
                                }}
                                className="hidden"
                            />
                        </label>

                        {/* Image Preview */}
                        {shipmentImageFile && (
                            <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-xl border bg-muted">
                                <img
                                    src={URL.createObjectURL(shipmentImageFile)}
                                    alt="preview"
                                    className="h-full w-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShipmentImageFile(null)}
                                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsShipmentImageModalOpen(false);
                                setShipmentImageFile(null);
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleShipmentImageUpload}
                            disabled={!shipmentImageFile || isUploading}
                        >
                            {isUploading ? "Uploading..." : "Upload Image"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Shipment Component */}
            <OrderShipment
                isSheetOpen={isSheetOpen}
                setIsSheetOpen={setIsSheetOpen}
                side="bottom"
                order={order}
                onShipmentSuccessRefetchOrder={onAction}
            />
        </>
    );
}
