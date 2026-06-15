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

const volumetricWeightGrams = (
    length?: number | null,
    width?: number | null,
    height?: number | null
) => {
    if (!length || !width || !height) return 0;
    return Math.round((length * width * height) / 5);
};

const resolveBrandPackingRule = (order: TableOrder) => {
    const orderItem = order.items[0];
    const product = orderItem?.product;

    if (!product?.brand?.packingRules?.length) return null;

    return (
        product.brand.packingRules.find(
            (rule) => rule.productTypeId === product.productTypeId
        ) ?? null
    );
};

const buildDimensionsFromPackingType = ({
    productLength,
    productWidth,
    productHeight,
    packingType,
}: {
    productLength: number;
    productWidth: number;
    productHeight: number;
    packingType?: {
        name?: string | null;
        baseLength: number;
        baseWidth: number;
        baseHeight: number;
    } | null;
}) => {
    if (!packingType) {
        return { length: 0, width: 0, height: 0, volumetricWeight: 0 };
    }

    const packingTypeName = packingType.name?.toLowerCase() ?? "";
    const isHardOrFragileBox =
        packingTypeName === "hard box" || packingTypeName === "fragile box";
    const length = isHardOrFragileBox
        ? productLength + packingType.baseLength
        : packingType.baseLength;
    const width = isHardOrFragileBox
        ? productWidth + packingType.baseWidth
        : packingType.baseWidth;
    const height = isHardOrFragileBox
        ? productHeight + packingType.baseHeight
        : packingType.baseHeight;

    return {
        length,
        width,
        height,
        volumetricWeight:
            length > 0 && width > 0 && height > 0
                ? volumetricWeightGrams(length, width, height)
                : 0,
    };
};

interface PageProps {
    order: TableOrder;
    onAction: () => void;
}

export function OrderAction({ order, onAction }: PageProps) {
    const shipment = order.shipments?.[0];
    const { data: orderShipmentDetails, refetch: refetchOrderShipmentDetails } =
        trpc.general.orders.getOrderShipmentDetailsByShipmentId.useQuery(
            {
                shipmentId: shipment?.shiprocketShipmentId
                    ? Number(shipment.shiprocketShipmentId)
                    : 0,
            },
            {
                enabled: !!shipment?.shiprocketShipmentId,
            }
        );
    const isDelhivery = Boolean(shipment?.uploadWbn || shipment?.awbNumber);
    const shipmentStatus = shipment?.status ?? "";
    const isShipmentScheduled = Boolean(shipment?.isPickupScheduled);
    const packingRule = resolveBrandPackingRule(order);
    const { data: packingTypesData } =
        trpc.general.packingTypes.getAll.useQuery(
            { page: 1, limit: 100 },
            { enabled: isDelhivery }
        );
    const orderItem = order.items[0];
    const dimensionSource = orderItem?.variant ?? orderItem?.product;
    const quantity = orderItem?.quantity ?? 1;
    const productLength = Number(dimensionSource?.length ?? 0);
    const productWidth = Number(dimensionSource?.width ?? 0);
    const productHeight = Number(dimensionSource?.height ?? 0) * quantity;
    const savedLength = shipment?.givenLength ?? order.givenLength ?? 0;
    const savedWidth = shipment?.givenWidth ?? order.givenWidth ?? 0;
    const savedHeight = shipment?.givenHeight ?? order.givenHeight ?? 0;
    const savedVolumetricWeight = volumetricWeightGrams(
        savedLength,
        savedWidth,
        savedHeight
    );
    const requiresPackageSelection = isDelhivery && savedVolumetricWeight <= 0;
    const packingTypes = packingTypesData?.data ?? [];
    const shouldShowShipNow =
        Boolean(shipment) &&
        order.status !== "cancelled" &&
        order.status !== "delivered" &&
        order.status !== "shipped" &&
        !isShipmentScheduled &&
        ![
            "in_transit",
            "out_for_delivery",
            "delivered",
            "cancelled",
            "rto_initiated",
            "rto_delivered",
        ].includes(shipmentStatus);

    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
    const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [isAwbGenerated, setIsAwbGenerated] = useState(false);
    const [isShipmentGenerated, setIsShipmentGenerated] = useState(false);
    const [packageMode, setPackageMode] = useState<
        "saved" | "packing_type" | "custom"
    >(requiresPackageSelection ? "packing_type" : "saved");
    const [selectedPackingTypeId, setSelectedPackingTypeId] = useState(
        packingRule?.packingType?.id ?? ""
    );
    const [customLength, setCustomLength] = useState("");
    const [customWidth, setCustomWidth] = useState("");
    const [customHeight, setCustomHeight] = useState("");
    const isCancelled =
        order.status === "cancelled" || shipmentStatus === "cancelled";

    const showDownloadLabel =
        !isCancelled &&
        !shouldShowShipNow &&
        (isDelhivery
            ? Boolean(shipment?.awbNumber || shipment?.uploadWbn)
            : isAwbGenerated);

    const primaryActionLabel = shouldShowShipNow
        ? requiresPackageSelection
            ? "Choose Package & Ship"
            : "Ship Now"
        : showDownloadLabel
          ? "Download Label"
          : null;

    const handlePrimaryAction = () => {
        if (shouldShowShipNow) {
            handleShipNowClick();
            return;
        }

        if (showDownloadLabel) {
            setIsLabelModalOpen(true);
        }
    };

    const selectedPackingType =
        packingTypes.find(
            (packingType) => packingType.id === selectedPackingTypeId
        ) ??
        (selectedPackingTypeId === packingRule?.packingType?.id
            ? packingRule?.packingType
            : null) ??
        null;
    const packingTypeDimensions = buildDimensionsFromPackingType({
        productLength,
        productWidth,
        productHeight,
        packingType: selectedPackingType,
    });
    const customDimensions = {
        length: Number(customLength) || 0,
        width: Number(customWidth) || 0,
        height: Number(customHeight) || 0,
    };
    const customVolumetricWeight =
        customDimensions.length > 0 &&
        customDimensions.width > 0 &&
        customDimensions.height > 0
            ? volumetricWeightGrams(
                  customDimensions.length,
                  customDimensions.width,
                  customDimensions.height
              )
            : 0;
    const selectedVolumetricWeight =
        packageMode === "custom"
            ? customVolumetricWeight
            : packageMode === "packing_type"
              ? packingTypeDimensions.volumetricWeight
              : savedVolumetricWeight;

    useEffect(() => {
        console.log("Order Shipment Details:", order);
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

    useEffect(() => {
        setPackageMode(requiresPackageSelection ? "packing_type" : "saved");
        setSelectedPackingTypeId(packingRule?.packingType?.id ?? "");
    }, [packingRule?.packingType?.id, requiresPackageSelection]);

    const handleShipNowClick = () => {
        if (requiresPackageSelection) {
            setIsPackageModalOpen(true);
            return;
        }

        setIsSheetOpen(true);
    };

    const continueToShipNow = () => {
        if (packageMode === "packing_type" && !selectedPackingTypeId) {
            toast.error("Please select a packing type.");
            return;
        }

        if (
            (packageMode === "packing_type" || packageMode === "custom") &&
            selectedVolumetricWeight <= 0
        ) {
            toast.error("Please enter valid package dimensions.");
            return;
        }

        setIsPackageModalOpen(false);
        setIsSheetOpen(true);
    };
    // Frontend download function
    const downloadDelhiveryLabel = async () => {
        try {
            console.log(
                "🖱️ Download initiated for WBN:",
                order?.shipments?.[0]?.awbNumber
            );
            const res = await fetch("/api/delhivery/label", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wbn: order?.shipments?.[0]?.awbNumber }),
            });

            console.log("🖱️ Response Status:", res.status);
            console.log(
                "🖱️ Response Headers:",
                Object.fromEntries(res.headers.entries())
            );

            if (!res.ok) {
                const errorData = await res.json();
                console.error("❌ Frontend Error:", errorData);
                toast.error(errorData.message || "Failed to download label");
                return;
            }

            const blob = await res.blob();
            console.log("🖱️ Blob Size:", blob.size);
            console.log("🖱️ Blob Type:", blob.type);
            // Verify it's a valid PDF by checking the first few bytes
            const arrayBuffer = await blob.slice(0, 100).arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const header = new TextDecoder().decode(uint8Array.slice(0, 4));
            console.log("🖱️ PDF Header Check:", header, "(should be %PDF)");
            if (header !== "%PDF") {
                console.error("❌ Downloaded file is not a valid PDF");
                const text = new TextDecoder().decode(uint8Array);
                console.error("❌ File content (first 100 bytes):", text);
                toast.error("Downloaded file is not a valid PDF");
                return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;

            const contentDisposition = res.headers.get("content-disposition");
            let fileName = "delhivery_label.pdf";
            if (contentDisposition) {
                const fileNameMatch =
                    contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1];
                }
            }

            console.log("🖱️ Download File Name:", fileName);

            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Delhivery label downloaded!");
        } catch (err) {
            console.error("❌ Frontend Catch Error:", err);
            toast.error("Failed to download Delhivery label");
        }
    };

    const downloadDelhiveryInvoice = async () => {
        console.log(order, "cdhsecdscdhbc");
        try {
            const res = await fetch("/api/delhivery/invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order: {
                        id: order.id,
                        customerName:
                            order.user?.firstName + " " + order.user?.lastName,
                        phone: order.user?.phone,
                        address:
                            order.address.street +
                            ", " +
                            order.address.city +
                            ", " +
                            order.address.state +
                            " - " +
                            order.address.zip,
                        amount: order.totalAmount,
                        items: order.items[0].product,
                        brand: order.items[0].product.brand,
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
            console.error("Invoice Error:", err);
            toast.error("Could not download invoice");
        }
    };

    const handleDownload = async (type: "invoice" | "label" | "manifest") => {
        try {
            if (type === "invoice") {
                const response = await generateInvoice(
                    order.shipments[0].shiprocketOrderId
                );
                downloadFile(
                    response.invoiceUrl,
                    `invoice_${order.shipments[0].shiprocketOrderId}.pdf`
                );
                toast.success("Invoice download started");
            } else if (type === "label") {
                const response = await generateLabel(
                    order.shipments[0].shiprocketShipmentId
                );
                downloadFile(
                    response.labelUrl,
                    `label_${order.shipments[0].shiprocketShipmentId}.pdf`
                );
                toast.success("Label download started");
            } else if (type === "manifest") {
                const response = await generateManifest(
                    order.shipments[0].shiprocketShipmentId
                );
                downloadFile(
                    response.manifestUrl,
                    `manifest_${order.shipments[0].shiprocketShipmentId}.pdf`
                );
                toast.success("Manifest download started");
            }
        } catch (error: any) {
            console.error(`Error downloading ${type}:`, error);
            let errorMessage = `Failed to download ${type}. Please try again.`;
            if (
                type === "manifest" &&
                (error.message?.includes("already generated") ||
                    error.message?.includes("already downloaded") ||
                    error.response?.data?.message?.includes(
                        "already generated"
                    ))
            ) {
                errorMessage =
                    "Manifest has already been generated and can only be downloaded once.";
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
            <div className="flex min-w-[8.5rem] flex-col items-stretch gap-2 sm:min-w-0 sm:flex-row sm:items-center">
                {primaryActionLabel ? (
                    <Button
                        variant="outline"
                        onClick={handlePrimaryAction}
                        className={cn(
                            "h-8 w-full whitespace-nowrap rounded-md px-3 text-xs font-medium shadow-none sm:w-auto",
                            shouldShowShipNow
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        {primaryActionLabel}
                    </Button>
                ) : null}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-full p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 sm:size-8 sm:w-auto"
                        >
                            <span className="sr-only">Open menu</span>
                            <Icons.MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>

                        <DropdownMenuGroup>
                            {/* Ship now: show only when pickup is not done. */}
                            {shouldShowShipNow && (
                                <DropdownMenuItem onClick={handleShipNowClick}>
                                    <Icons.Truck className="size-4" />
                                    <span>
                                        {requiresPackageSelection
                                            ? "Choose Package & Ship"
                                            : "Ship Now"}
                                    </span>
                                </DropdownMenuItem>
                            )}

                            {/* Download invoice: always shown. */}
                            <DropdownMenuItem
                                onClick={() => setIsInvoiceModalOpen(true)}
                            >
                                <Icons.FileText className="size-4" />
                                <span>Download Invoice</span>
                            </DropdownMenuItem>

                            {/* Delhivery label logic. */}
                            {isDelhivery &&
                                isShipmentScheduled &&
                                showDownloadLabel && (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setIsLabelModalOpen(true)
                                        }
                                    >
                                        <Icons.Tag className="size-4" />
                                        <span>Download Label</span>
                                    </DropdownMenuItem>
                                )}

                            {/* Shiprocket label logic. */}
                            {!isDelhivery && showDownloadLabel && (
                                <DropdownMenuItem
                                    onClick={() => setIsLabelModalOpen(true)}
                                >
                                    <Icons.Tag className="size-4" />
                                    <span>Download Label</span>
                                </DropdownMenuItem>
                            )}

                            {/* Manifest: Shiprocket only. */}
                            {!isDelhivery && showDownloadLabel && (
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
            </div>

            <Dialog
                open={isPackageModalOpen}
                onOpenChange={setIsPackageModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Choose Package Details</DialogTitle>
                        <DialogDescription>
                            This Delhivery order has 0 g volumetric weight. Pick
                            a packing type or enter custom LBH before shipping.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                        <div className="text-xs text-slate-600">
                            Saved package: {savedLength} x {savedWidth} x{" "}
                            {savedHeight} cm | {savedVolumetricWeight} g
                        </div>

                        <select
                            value={packageMode}
                            onChange={(event) =>
                                setPackageMode(
                                    event.target.value as
                                        | "saved"
                                        | "packing_type"
                                        | "custom"
                                )
                            }
                            className="w-full rounded-md border p-2 text-sm"
                        >
                            {!requiresPackageSelection && (
                                <option value="saved">Use saved package</option>
                            )}
                            <option value="packing_type">
                                Select packing type
                            </option>
                            <option value="custom">Custom LBH</option>
                        </select>

                        {packageMode === "packing_type" && (
                            <div className="space-y-2">
                                <select
                                    value={selectedPackingTypeId}
                                    onChange={(event) =>
                                        setSelectedPackingTypeId(
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-md border p-2 text-sm"
                                >
                                    <option value="">
                                        Select packing type
                                    </option>
                                    {packingRule?.packingType && (
                                        <option
                                            value={packingRule.packingType.id}
                                        >
                                            {packingRule.packingType.name}{" "}
                                            (Suggested)
                                        </option>
                                    )}
                                    {packingTypes
                                        .filter(
                                            (packingType) =>
                                                packingType.id !==
                                                packingRule?.packingType?.id
                                        )
                                        .map((packingType) => (
                                            <option
                                                key={packingType.id}
                                                value={packingType.id}
                                            >
                                                {packingType.name}
                                            </option>
                                        ))}
                                </select>

                                <div className="text-xs text-slate-600">
                                    Calculated: {packingTypeDimensions.length} x{" "}
                                    {packingTypeDimensions.width} x{" "}
                                    {packingTypeDimensions.height} cm |{" "}
                                    {packingTypeDimensions.volumetricWeight} g
                                </div>
                            </div>
                        )}

                        {packageMode === "custom" && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        value={customLength}
                                        onChange={(event) =>
                                            setCustomLength(event.target.value)
                                        }
                                        placeholder="Length"
                                        className="rounded-md border p-2 text-sm"
                                        inputMode="numeric"
                                    />
                                    <input
                                        value={customWidth}
                                        onChange={(event) =>
                                            setCustomWidth(event.target.value)
                                        }
                                        placeholder="Width"
                                        className="rounded-md border p-2 text-sm"
                                        inputMode="numeric"
                                    />
                                    <input
                                        value={customHeight}
                                        onChange={(event) =>
                                            setCustomHeight(event.target.value)
                                        }
                                        placeholder="Height"
                                        className="rounded-md border p-2 text-sm"
                                        inputMode="numeric"
                                    />
                                </div>

                                <div className="text-xs text-slate-600">
                                    Calculated: {customDimensions.length} x{" "}
                                    {customDimensions.width} x{" "}
                                    {customDimensions.height} cm |{" "}
                                    {customVolumetricWeight} g
                                </div>
                            </div>
                        )}

                        <div className="text-xs font-medium text-slate-700">
                            Selected volumetric weight:{" "}
                            {selectedVolumetricWeight} g
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsPackageModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={continueToShipNow}>
                            Continue to Ship Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invoice Modal */}
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
                                if (isDelhivery) {
                                    await downloadDelhiveryInvoice();
                                } else {
                                    await handleDownload("invoice");
                                }
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
                                if (isDelhivery) {
                                    await downloadDelhiveryLabel();
                                } else {
                                    await handleDownload("label");
                                }
                                setIsLabelModalOpen(false);
                            }}
                        >
                            Download
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manifest Modal */}
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
                    <p className={cn("text-[#FF5733]", "font-bold")}>
                        Note: You can download only once for this label.
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

            {/* Shipment Component */}
            <OrderShipment
                isSheetOpen={isSheetOpen}
                setIsSheetOpen={setIsSheetOpen}
                initialPackageSelection={{
                    packageMode,
                    selectedPackingTypeId,
                    customLength,
                    customWidth,
                    customHeight,
                }}
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
