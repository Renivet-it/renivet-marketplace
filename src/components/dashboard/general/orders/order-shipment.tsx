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
import { cn } from "@/lib/utils";
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
    const { data: customerAddressDetails, refetch: refetchCustomerAddress } =
        trpc.general.addresses.getAddressById.useQuery(
            {
                addressId: order.addressId,
            },
            {
                enabled: false,
            }
        );
    const { data: brandAddressDetails, refetch: refetchBrandAddress } =
        trpc.general.addresses.getBrandAddressFromOrderID.useQuery(
            {
                orderId: order.id,
            },
            {
                enabled: false,
            }
        );
    const [loading, setLoading] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false);
    const [allCourierResponse, setAllCourierResponse] = useState(undefined);
    const [recommendedCourierForShiping, setRecommendedCourierForShiping] =
        useState<ApiResponse<CourierListResponse> | undefined>(undefined);
    const [selectedCourier, setSelectedCourier] =
        useState<GetCourierForDeliveryLocation | null>(null);
    const [serviceabilityParams, setServiceabilityParams] =
        useState<initialShippingAvaibilityParams | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        undefined
    );

    const handleShipNow = async () => {
        if (!serviceabilityParams || !selectedDate || !selectedCourier) {
            toast.error("Please select a shipping date and a courier partner.");
            return;
        }
        setButtonLoading(true);
        const awbPayload = {
            shipment_id: order.shipments[0].shiprocketShipmentId,
            courier_id: selectedCourier.courier_company_id,
        };
        const pickUpRequestPayload = {
            shipment_id: order.shipments[0].shiprocketShipmentId,
            pickup_date: format(selectedDate, "yyyy-MM-dd"),
        };
        try {
            const generateAwb = await fetch(
                "/api/shiprocket/couriers/generate-awb",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(awbPayload),
                }
            );
            const awbData = await generateAwb.json();
            if (!awbData.status) {
                toast.error(awbData.message);
                return;
            }
            if (awbData.status) {
                toast.success(awbData.message);
            }
            const madePickUpRequest = await fetch(
                "/api/shiprocket/couriers/pickup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(pickUpRequestPayload),
                }
            );
            const pickUpData = await madePickUpRequest.json();
            if (!pickUpData.status) {
                toast.error(pickUpData.message);
                return;
            }
            if (pickUpData.status) {
                toast.success(pickUpData.message);
            }
            toast.success("Pickup request generated successfully!");
            setIsSheetOpen(false);
            onShipmentSuccessRefetchOrder();
        } catch (error) {
            toast.error("An error occurred while generating the AWB.");
            console.error(error);
        } finally {
            setButtonLoading(false);
        }
    };

    useEffect(() => {
        const fetchCouriers = async () => {
            setLoading(true);
            setButtonLoading(true);
            try {
                const { data: newCustomerAddressDetails } =
                    await refetchCustomerAddress();
                const { data: newBrandAddressDetails } =
                    await refetchBrandAddress();

                console.log("Initial order:", order);

                const initialParams: initialShippingAvaibilityParams = {
                    pickup_postcode: `${newBrandAddressDetails?.warehousePostalCode ?? ""}`,
                    delivery_postcode: `${newCustomerAddressDetails?.zip ?? ""}`,
                    order_id: `${order.shipments[0].shiprocketOrderId ?? ""}`,
                };
                console.log("Initial Params:", initialParams);
                // Save the params to state
                setServiceabilityParams(initialParams);

                // Fetch all couriers
                const couriersResponse = await fetch(
                    "/api/shiprocket/couriers"
                );
                const couriersData = await couriersResponse.json();
                setAllCourierResponse(couriersData);

                // Fetch recommended courier based on serviceability params
                const queryParams = new URLSearchParams(
                    initialParams as any
                ).toString();
                const recommendedResponse = await fetch(
                    `/api/shiprocket/couriers/serviceability?${queryParams}`
                );
                const recommendedData = await recommendedResponse.json();
                setRecommendedCourierForShiping(recommendedData);
            } catch (err) {
                toast.error("Something went wrong");
            } finally {
                setLoading(false);
                setButtonLoading(false);
            }
        };
        if (isSheetOpen) fetchCouriers();
    }, [isSheetOpen]);

    return (
        <>
            <Sheet
                open={isSheetOpen}
                onOpenChange={() => {
                    setIsSheetOpen(false);
                    setSelectedDate(undefined);
                }}
            >
                <SheetContent side={side}>
                    <SheetHeader className="mb-4">
                        <SheetTitle className={cn("capitalize text-primary")}>
                            Ship Products with our active courier partners
                        </SheetTitle>
                        <SheetDescription
                            className={cn("text-sm uppercase text-secondary")}
                        >
                            Display the list of courier partners and their
                            details please select your preferred
                        </SheetDescription>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal sm:w-[260px]",
                                            !selectedDate &&
                                                "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate
                                            ? format(selectedDate, "PPP")
                                            : "Pick a shipping date"}
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

                            <Button
                                className="flex items-center gap-2" // You can adjust the layout of the icon and text
                                onClick={handleShipNow}
                                disabled={buttonLoading}
                            >
                                <Truck className="h-4 w-4" />{" "}
                                {/* Adjust the size of the icon */}
                                Ship Now
                            </Button>
                        </div>
                    </SheetHeader>
                    {loading ? (
                        <div className="flex h-24 items-center justify-center text-muted-foreground">
                            <Loader2 className="mr-2 animate-spin" />
                            Loading courier partners...
                        </div>
                    ) : recommendedCourierForShiping?.data?.data
                          .available_courier_companies?.length ? (
                        <CourierCardList
                            couriers={
                                recommendedCourierForShiping.data.data
                                    .available_courier_companies as GetCourierForDeliveryLocation[]
                            }
                            selectedCourierId={
                                selectedCourier?.courier_company_id
                            }
                            onCourierSelect={(
                                courier: GetCourierForDeliveryLocation
                            ) => {
                                setSelectedCourier(courier);
                            }}
                        />
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            No courier data found.
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
