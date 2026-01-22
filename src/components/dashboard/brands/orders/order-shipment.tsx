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
    // shiprocket/delhivery fields are FLAT, not nested
    const isDelhivery = Boolean(order.uploadWbn);
    const { data: userData } = trpc.general.users.currentUser.useQuery();

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
    const [selectedTime, setSelectedTime] = useState<string | undefined>();

    // correct pickup location
    const pickupLocation = generatePickupLocationCode({
        brandId: userData?.brand?.id ?? "",
        brandName: userData?.brand?.name ?? "",
    });

    /* ---------------------------------------------
       HANDLE SHIP NOW CLICK
    ---------------------------------------------- */
    const handleShipNow = async () => {
        if (!selectedDate) {
            toast.error("Please select a pickup date.");
            return;
        }

        if (isDelhivery && !selectedTime) {
            toast.error("Please select a pickup time.");
            return;
        }

        setButtonLoading(true);

        try {
            /* ---------- DELHIVERY FLOW ---------- */
            if (isDelhivery) {
                const body = {
                    pickup_location: pickupLocation,
                    pickup_date: format(selectedDate, "yyyy-MM-dd"),
                    pickup_time: selectedTime,
                    expected_package_count: 1,
                };

                const res = await fetch("/api/delhivery/pickup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });

                const data = await res.json();
                if (!data.success) {
                    toast.error(data.message);
                    return;
                }

                toast.success("Delhivery pickup scheduled!");
                setIsSheetOpen(false);
                onShipmentSuccessRefetchOrder();
                return;
            }

            /* ---------- SHIPROCKET FLOW ---------- */
            if (!selectedCourier) {
                toast.error("Please select a courier partner.");
                return;
            }

            const awbPayload = {
                shipment_id: order.shiprocketShipmentId,
                courier_id: selectedCourier.courier_company_id,
            };

            const pickupPayload = {
                shipment_id: order.shiprocketShipmentId,
                pickup_date: format(selectedDate, "yyyy-MM-dd"),
            };

            const generateAwbRes = await fetch(
                "/api/shiprocket/couriers/generate-awb",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(awbPayload),
                }
            );

            const awbData = await generateAwbRes.json();
            if (!awbData.status) {
                toast.error(awbData.message);
                return;
            }

            toast.success(awbData.message);

            const pickupRes = await fetch("/api/shiprocket/couriers/pickup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pickupPayload),
            });

            const pickupData = await pickupRes.json();
            if (!pickupData.status) {
                toast.error(pickupData.message);
                return;
            }

            toast.success("Shiprocket pickup scheduled!");
            setIsSheetOpen(false);
            onShipmentSuccessRefetchOrder();
        } catch (err) {
            toast.error("Something went wrong.");
        } finally {
            setButtonLoading(false);
        }
    };

    /* ---------------------------------------------
       LOAD COURIERS (only for Shiprocket)
    ---------------------------------------------- */
    useEffect(() => {
        if (!isSheetOpen || isDelhivery) return;

        const load = async () => {
            setLoading(true);
            setButtonLoading(true);

            try {
                const { data: customer } = await refetchCustomerAddress();
                const { data: brand } = await refetchBrandAddress();

                const params = {
                    pickup_postcode: `${brand?.warehousePostalCode ?? ""}`,
                    delivery_postcode: `${customer?.zip ?? ""}`,
                    order_id: `${order.shiprocketOrderId ?? ""}`,
                };

                setServiceabilityParams(params);

                const recommendedResponse = await fetch(
                    `/api/shiprocket/couriers/serviceability?${new URLSearchParams(params as any)}`
                );

                const recommendedData = await recommendedResponse.json();
                setRecommendedCourierForShiping(recommendedData);
            } finally {
                setLoading(false);
                setButtonLoading(false);
            }
        };

        load();
    }, [isSheetOpen]);

    /* ---------------------------------------------
       UI
    ---------------------------------------------- */
    return (
        <Sheet
            open={isSheetOpen}
            onOpenChange={() => {
                setIsSheetOpen(false);
                setSelectedDate(undefined);
                setSelectedTime(undefined);
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
                            ? "Select pickup date & time"
                            : "Select courier partner for shipping"}
                    </SheetDescription>

                    <div className="mt-4 flex flex-col gap-3">
                        {/* DATE PICKER */}
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

                        {/* TIME SELECT FOR DELHIVERY */}
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
                                        format(selectedDate, "yyyy-MM-dd") ===
                                            format(now, "yyyy-MM-dd");

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

                {/* COURIER LIST (SHIPROCKET ONLY) */}
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
    );
}
