"use client";

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
import { CalendarIcon, Loader2, Truck } from "lucide-react";
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
}

interface initialShippingAvaibilityParams {
    pickup_postcode: string;
    delivery_postcode: string;
    order_id: string;
}

export default function OrderShipment({
    isSheetOpen,
    setIsSheetOpen,
    side = "right",
    order,
    onShipmentSuccessRefetchOrder,
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

    const shipment = order.shipments?.[0];
    const isDelhivery = Boolean(shipment?.uploadWbn);

    // ====== ADD: generate pickupLocation the same way backend does ======
    const pickupLocation = generatePickupLocationCode({
        brandId: shipment?.brandId ?? "",
        brandName: order.items[0]?.product.brand.name ?? "",
    });
    console.log("⭐ Generated pickupLocation (for Delhivery):", pickupLocation);
    // ================================================================

    console.log("⭐ Shipment Type:", isDelhivery ? "Delhivery" : "Shiprocket");
const utils = trpc.useUtils();
const updatePickupStatus = trpc.general.orders.updatePickupStatus.useMutation();

    /* -----------------------------------------------------------
     ⭐ HANDLE SHIP NOW CLICK
    ------------------------------------------------------------ */
    const handleShipNow = async () => {
        if (!selectedDate) {
            toast.error("Please select a pickup date.");
            return;
        }

        if (isDelhivery && !selectedTime) {
            toast.error("Please select a pickup time (Delhivery requires time).");
            return;
        }

        setButtonLoading(true);

        try {
            /* -----------------------------------------------------------
             ⭐ DELHIVERY PICKUP FLOW
            ------------------------------------------------------------ */
            if (isDelhivery) {
                const dateStr = format(selectedDate, "yyyy-MM-dd");

                const delhiveryPayload = {
                    // ====== USE the generated pickupLocation here ======
                    pickup_location: pickupLocation,
                    // ==================================================
                    pickup_date: dateStr,
                    pickup_time: selectedTime, // ⭐ TIME INCLUDED
                    expected_package_count: 1,
                };

                console.log("📦 Sending Delhivery Pickup Payload:", delhiveryPayload);

                const res = await fetch("/api/delhivery/pickup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(delhiveryPayload),
                });

                const data = await res.json();

                if (!data.success) {
                    toast.error(data.message || "Failed to schedule Delhivery pickup");
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

        if (isDelhivery) return;

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
    }, [isSheetOpen]);

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
                            {/* ⭐ PICKUP DATE */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !selectedDate && "text-muted-foreground"
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
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="border rounded-md p-2 text-sm w-full"
                                >
                                    <option value="">Select Pickup Time</option>
                                    <option value="09:00:00">9 AM – 10 AM</option>
                                    <option value="11:00:00">11 AM – 12 PM</option>
                                    <option value="14:00:00">2 PM – 3 PM</option>
                                    <option value="16:00:00">4 PM – 5 PM</option>
                                    <option value="18:00:00">6 PM – 7 PM</option>
                                </select>
                            )}

                            {/* SHIP NOW BUTTON */}
<Button
    className="flex items-center gap-2"
    onClick={handleShipNow}
    disabled={buttonLoading}
>
    {buttonLoading ? (
        <>
            <Loader2 className="h-4 w-4 animate-spin" />
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
                                <Loader2 className="mr-2 animate-spin" />
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
