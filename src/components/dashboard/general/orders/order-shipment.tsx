"use client";
import { Spinner } from "@/components/ui/spinner";

import {
    ApiResponse,
    CourierListResponse,
    GetCourierForDeliveryLocation,
} from "@/actions/shiprocket/types/CourierContext";
import { Button } from "@/components/ui/button-general";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc/client";
import { cn, generatePickupLocationCode } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CourierCardList from "./courier-card-list";
import { TableOrder } from "./orders-table";

// ====== ADD: import your pickup location generator ======
// =======================================================

interface PageProps {
    isSheetOpen: boolean;
    setIsSheetOpen: (value: boolean) => void;
    side?: "top" | "bottom" | "left" | "right";
    order: TableOrder;
    onShipmentSuccessRefetchOrder: () => void;
    initialPackageSelection?: {
        packageMode: "saved" | "packing_type" | "custom";
        selectedPackingTypeId?: string;
        customLength?: string;
        customWidth?: string;
        customHeight?: string;
    } | null;
}

interface initialShippingAvaibilityParams {
    pickup_postcode: string;
    delivery_postcode: string;
    order_id: string;
}

const volumetricWeightGrams = (length: number, width: number, height: number) =>
    Math.round((length * width * height) / 5);

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

export default function OrderShipment({
    isSheetOpen,
    setIsSheetOpen,
    side = "right",
    order,
    onShipmentSuccessRefetchOrder,
    initialPackageSelection,
}: PageProps) {
    const { data: customerAddressDetails, refetch: refetchCustomerAddress } =
        trpc.general.addresses.getAddressById.useQuery(
            { addressId: order.addressId },
            { enabled: false }
        );

    const { data: brandAddressDetails, refetch: refetchBrandAddress } =
        trpc.general.addresses.getBrandAddressFromOrderID.useQuery(
            { orderId: order.id },
            { enabled: false }
        );

    const [loading, setLoading] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false);
    const [selectedCourier, setSelectedCourier] =
        useState<GetCourierForDeliveryLocation | null>(null);
    const [recommendedCourierForShiping, setRecommendedCourierForShiping] =
        useState<ApiResponse<CourierListResponse> | undefined>(undefined);
    const [serviceabilityParams, setServiceabilityParams] =
        useState<initialShippingAvaibilityParams | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState<string | undefined>(); // ⭐ NEW

    const [packageMode, setPackageMode] = useState<
        "saved" | "packing_type" | "custom"
    >("saved");
    const [selectedPackingTypeId, setSelectedPackingTypeId] = useState("");
    const [customLength, setCustomLength] = useState("");
    const [customWidth, setCustomWidth] = useState("");
    const [customHeight, setCustomHeight] = useState("");

    const shipment = order.shipments?.[0];
    const isDelhivery = Boolean(shipment?.uploadWbn || shipment?.awbNumber);
    const packingRule = resolveBrandPackingRule(order);
    const { data: packingTypesData } = trpc.general.packingTypes.getAll.useQuery(
        { page: 1, limit: 100 },
        { enabled: isSheetOpen && isDelhivery }
    );
    const updateDelhiveryDimensions =
        trpc.general.orders.updateDelhiveryDimensions.useMutation();
    const orderItem = order.items[0];
    const dimensionSource = orderItem?.variant ?? orderItem?.product;
    const quantity = orderItem?.quantity ?? 1;
    const productLength = Number(dimensionSource?.length ?? 0);
    const productWidth = Number(dimensionSource?.width ?? 0);
    const productHeight = Number(dimensionSource?.height ?? 0) * quantity;
    const savedLength = shipment?.givenLength ?? order.givenLength ?? 0;
    const savedWidth = shipment?.givenWidth ?? order.givenWidth ?? 0;
    const savedHeight = shipment?.givenHeight ?? order.givenHeight ?? 0;
    const savedVolumetricWeight =
        savedLength > 0 && savedWidth > 0 && savedHeight > 0
            ? volumetricWeightGrams(savedLength, savedWidth, savedHeight)
            : 0;
    const requiresPackageSelection =
        isDelhivery && savedVolumetricWeight <= 0;
    const packingTypes = packingTypesData?.data ?? [];
    const selectedPackingType =
        packingTypes.find((packingType) => packingType.id === selectedPackingTypeId) ??
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
    const activeDimensions =
        packageMode === "custom"
            ? {
                  ...customDimensions,
                  volumetricWeight: customVolumetricWeight,
              }
            : packageMode === "packing_type"
              ? packingTypeDimensions
              : {
                    length: savedLength,
                    width: savedWidth,
                    height: savedHeight,
                    volumetricWeight: savedVolumetricWeight,
                };

    // ====== ADD: generate pickupLocation the same way backend does ======
    const pickupLocation = generatePickupLocationCode({
        brandId: shipment?.brandId ?? "",
        brandName: order.items[0]?.product.brand.name ?? "",
    });
    console.log("⭐ Generated pickupLocation (for Delhivery):", pickupLocation);
    // ================================================================

    console.log("⭐ Shipment Type:", isDelhivery ? "Delhivery" : "Shiprocket");
    const utils = trpc.useUtils();
    const updatePickupStatus =
        trpc.general.orders.updatePickupStatus.useMutation();

    /* -----------------------------------------------------------
     ⭐ HANDLE SHIP NOW CLICK
    ------------------------------------------------------------ */
    const handleShipNow = async () => {
        if (!selectedDate) {
            toast.error("Please select a pickup date.");
            return;
        }

        if (isDelhivery && !selectedTime) {
            toast.error(
                "Please select a pickup time (Delhivery requires time)."
            );
            return;
        }

        setButtonLoading(true);

        try {
            /* -----------------------------------------------------------
             ⭐ DELHIVERY PICKUP FLOW
            ------------------------------------------------------------ */
            if (isDelhivery) {
                const awbNumber = shipment?.awbNumber || order.awbNumber;

                if (activeDimensions.volumetricWeight <= 0) {
                    toast.error(
                        "Please select a packing type or enter custom dimensions before shipping."
                    );
                    return;
                }

                if (!awbNumber) {
                    toast.error("AWB number is missing for this Delhivery order.");
                    return;
                }

                await updateDelhiveryDimensions.mutateAsync({
                    orderId: order.id,
                    awbNumber,
                    length: activeDimensions.length,
                    width: activeDimensions.width,
                    height: activeDimensions.height,
                    volumetricWeight: activeDimensions.volumetricWeight,
                });

                const dateStr = format(selectedDate, "yyyy-MM-dd");

                const delhiveryPayload = {
                    // ====== USE the generated pickupLocation here ======
                    pickup_location: pickupLocation,
                    // ==================================================
                    pickup_date: dateStr,
                    pickup_time: selectedTime, // ⭐ TIME INCLUDED
                    expected_package_count: 1,
                };

                console.log(
                    "📦 Sending Delhivery Pickup Payload:",
                    delhiveryPayload
                );

                const res = await fetch("/api/delhivery/pickup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(delhiveryPayload),
                });

                const data = await res.json();

                if (!data.success) {
                    toast.error(
                        data.message || "Failed to schedule Delhivery pickup"
                    );
                    return;
                }

                toast.success("Delhivery pickup scheduled!");
                // update DB pickup status
                await updatePickupStatus.mutateAsync({ orderId: order.id });

                // OPTIONAL: refresh order table
                utils.general.orders.getOrders.invalidate();
                setIsSheetOpen(false);
                onShipmentSuccessRefetchOrder();
                return;
            }

            /* -----------------------------------------------------------
             🚚 SHIPROCKET PICKUP FLOW
            ------------------------------------------------------------ */
            if (!selectedCourier) {
                toast.error("Please select a courier partner.");
                return;
            }

            const awbPayload = {
                shipment_id: shipment.shiprocketShipmentId,
                courier_id: selectedCourier.courier_company_id,
            };

            const pickUpRequestPayload = {
                shipment_id: shipment.shiprocketShipmentId,
                pickup_date: format(selectedDate, "yyyy-MM-dd"),
            };

            const generateAwb = await fetch(
                "/api/shiprocket/couriers/generate-awb",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(awbPayload),
                }
            );
            const awbData = await generateAwb.json();

            if (!awbData.status) {
                toast.error(awbData.message);
                return;
            }

            toast.success(awbData.message);

            const madePickUpRequest = await fetch(
                "/api/shiprocket/couriers/pickup",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(pickUpRequestPayload),
                }
            );
            const pickUpData = await madePickUpRequest.json();

            if (!pickUpData.status) {
                toast.error(pickUpData.message);
                return;
            }

            toast.success("Shiprocket pickup successfully scheduled!");
            setIsSheetOpen(false);
            onShipmentSuccessRefetchOrder();
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong.");
        } finally {
            setButtonLoading(false);
        }
    };

    /* -----------------------------------------------------------
     LOAD SHIPROCKET COURIERS (only if NOT Delhivery)
    ------------------------------------------------------------ */
    useEffect(() => {
        if (!isSheetOpen) return;

        if (isDelhivery) {
            setPackageMode(
                initialPackageSelection?.packageMode ??
                    (requiresPackageSelection ? "packing_type" : "saved")
            );
            setSelectedPackingTypeId(
                initialPackageSelection?.selectedPackingTypeId ??
                    packingRule?.packingType?.id ??
                    ""
            );
            setCustomLength(initialPackageSelection?.customLength ?? "");
            setCustomWidth(initialPackageSelection?.customWidth ?? "");
            setCustomHeight(initialPackageSelection?.customHeight ?? "");
            return;
        }

        const fetchCouriers = async () => {
            setLoading(true);
            setButtonLoading(true);

            try {
                const { data: newCustomerAddressDetails } =
                    await refetchCustomerAddress();
                const { data: newBrandAddressDetails } =
                    await refetchBrandAddress();

                const initialParams: initialShippingAvaibilityParams = {
                    pickup_postcode: `${newBrandAddressDetails?.warehousePostalCode ?? ""}`,
                    delivery_postcode: `${newCustomerAddressDetails?.zip ?? ""}`,
                    order_id: `${shipment.shiprocketOrderId ?? ""}`,
                };

                setServiceabilityParams(initialParams);

                const recommendedResponse = await fetch(
                    `/api/shiprocket/couriers/serviceability?${new URLSearchParams(
                        initialParams as any
                    )}`
                );
                const recommendedData = await recommendedResponse.json();
                setRecommendedCourierForShiping(recommendedData);
            } catch (error) {
                toast.error("Something went wrong.");
            } finally {
                setLoading(false);
                setButtonLoading(false);
            }
        };

        fetchCouriers();
    }, [
        initialPackageSelection?.customHeight,
        initialPackageSelection?.customLength,
        initialPackageSelection?.customWidth,
        initialPackageSelection?.packageMode,
        initialPackageSelection?.selectedPackingTypeId,
        isSheetOpen,
        isDelhivery,
        packingRule?.packingType?.id,
        requiresPackageSelection,
    ]);

    return (
        <>
            <Sheet
                open={isSheetOpen}
                onOpenChange={() => {
                    setIsSheetOpen(false);
                    setSelectedDate(undefined);
                    setSelectedTime(undefined); // ⭐ Reset Time
                }}
            >
                <SheetContent side={side}>
                    <SheetHeader className="mb-4">
                        <SheetTitle className={cn("capitalize text-primary")}>
                            {isDelhivery
                                ? "Schedule Delhivery Pickup"
                                : "Ship Products with Courier Partners"}
                        </SheetTitle>

                        <SheetDescription className="text-sm uppercase text-secondary">
                            {isDelhivery
                                ? "Select pickup date & time for Delhivery"
                                : "Select your preferred courier partner"}
                        </SheetDescription>

                        <div className="mt-4 flex flex-col gap-3">
                            {isDelhivery && (
                                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                                    <div className="font-medium text-slate-900">
                                        Package Details
                                    </div>
                                    <div className="mt-1 text-xs text-slate-600">
                                        Saved: {savedLength} x {savedWidth} x {savedHeight} cm
                                        {" · "}
                                        {savedVolumetricWeight} g
                                    </div>
                                    {requiresPackageSelection && (
                                        <div className="mt-2 text-xs font-medium text-amber-700">
                                            Volumetric weight is 0 g, so choose a packing type or enter custom LBH before shipping.
                                        </div>
                                    )}
                                    {requiresPackageSelection && (
                                        <div className="mt-3 space-y-3">
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
                                                    <option value="saved">
                                                        Use saved package
                                                    </option>
                                                )}
                                                <option value="packing_type">
                                                    Select packing type
                                                </option>
                                                <option value="custom">
                                                    Custom LBH
                                                </option>
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
                                                                {packingRule.packingType.name} (Suggested)
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
                                                        Calculated:{" "}
                                                        {packingTypeDimensions.length} x{" "}
                                                        {packingTypeDimensions.width} x{" "}
                                                        {packingTypeDimensions.height} cm
                                                        {" · "}
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
                                                                setCustomLength(
                                                                    event.target.value
                                                                )
                                                            }
                                                            placeholder="Length"
                                                            className="rounded-md border p-2 text-sm"
                                                            inputMode="numeric"
                                                        />
                                                        <input
                                                            value={customWidth}
                                                            onChange={(event) =>
                                                                setCustomWidth(
                                                                    event.target.value
                                                                )
                                                            }
                                                            placeholder="Width"
                                                            className="rounded-md border p-2 text-sm"
                                                            inputMode="numeric"
                                                        />
                                                        <input
                                                            value={customHeight}
                                                            onChange={(event) =>
                                                                setCustomHeight(
                                                                    event.target.value
                                                                )
                                                            }
                                                            placeholder="Height"
                                                            className="rounded-md border p-2 text-sm"
                                                            inputMode="numeric"
                                                        />
                                                    </div>
                                                    <div className="text-xs text-slate-600">
                                                        Calculated:{" "}
                                                        {customDimensions.length} x{" "}
                                                        {customDimensions.width} x{" "}
                                                        {customDimensions.height} cm
                                                        {" · "}
                                                        {customVolumetricWeight} g
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-xs font-medium text-slate-700">
                                                Shipping with: {activeDimensions.length} x{" "}
                                                {activeDimensions.width} x{" "}
                                                {activeDimensions.height} cm
                                                {" · "}
                                                {activeDimensions.volumetricWeight} g
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* ⭐ PICKUP DATE */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !selectedDate &&
                                                "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate
                                            ? format(selectedDate, "PPP")
                                            : "Pick pickup date"}
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        initialFocus
                                        disabled={(date) => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            return date < today;
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>

                            {/* ⭐ TIME PICKER FOR DELHIVERY */}
                            {isDelhivery && (
                                <select
                                    value={selectedTime}
                                    onChange={(e) =>
                                        setSelectedTime(e.target.value)
                                    }
                                    className="w-full rounded-md border p-2 text-sm"
                                >
                                    <option value="">Select Pickup Time</option>
                                    {(() => {
                                        const PICKUP_TIME_SLOTS = [
                                            {
                                                value: "09:00:00",
                                                label: "9 AM – 10 AM",
                                                hour: 9,
                                            },
                                            {
                                                value: "11:00:00",
                                                label: "11 AM – 12 PM",
                                                hour: 11,
                                            },
                                            {
                                                value: "14:00:00",
                                                label: "2 PM – 3 PM",
                                                hour: 14,
                                            },
                                            {
                                                value: "16:00:00",
                                                label: "4 PM – 5 PM",
                                                hour: 16,
                                            },
                                            {
                                                value: "18:00:00",
                                                label: "6 PM – 7 PM",
                                                hour: 18,
                                            },
                                        ];

                                        const now = new Date();
                                        const currentHour = now.getHours();
                                        const isToday =
                                            selectedDate &&
                                            format(
                                                selectedDate,
                                                "yyyy-MM-dd"
                                            ) === format(now, "yyyy-MM-dd");

                                        const availableSlots =
                                            PICKUP_TIME_SLOTS.filter((slot) => {
                                                if (!isToday) return true;
                                                return slot.hour > currentHour;
                                            });

                                        return availableSlots.map((slot) => (
                                            <option
                                                key={slot.value}
                                                value={slot.value}
                                            >
                                                {slot.label}
                                            </option>
                                        ));
                                    })()}
                                </select>
                            )}

                            {/* SHIP NOW BUTTON */}
                            <Button
                                className="flex items-center gap-2"
                                onClick={handleShipNow}
                                disabled={
                                    buttonLoading ||
                                    (isDelhivery &&
                                        packageMode === "packing_type" &&
                                        !selectedPackingTypeId)
                                }
                            >
                                {buttonLoading ? (
                                    <>
                                        <Spinner className="h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Truck className="h-4 w-4" />
                                        Ship Now
                                    </>
                                )}
                            </Button>
                        </div>
                    </SheetHeader>

                    {/* SHIPROCKET COURIER LIST */}
                    {!isDelhivery &&
                        (loading ? (
                            <div className="flex h-24 items-center justify-center text-muted-foreground">
                                <Spinner className="mr-2 animate-spin" />
                                Loading courier partners...
                            </div>
                        ) : recommendedCourierForShiping?.data?.data
                              ?.available_courier_companies?.length ? (
                            <CourierCardList
                                couriers={
                                    recommendedCourierForShiping.data.data
                                        .available_courier_companies as GetCourierForDeliveryLocation[]
                                }
                                selectedCourierId={
                                    selectedCourier?.courier_company_id
                                }
                                onCourierSelect={(c) => setSelectedCourier(c)}
                            />
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                No courier data found.
                            </div>
                        ))}
                </SheetContent>
            </Sheet>
        </>
    );
}
