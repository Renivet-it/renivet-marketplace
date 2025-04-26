"use client";

import {
    ApiResponse,
    CourierListResponse,
    GetCourierForDeliveryLocation,
} from "@/actions/shiprocket/types/CourierContext";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { GetCourierServiceabilityParams } from "@/lib/shiprocket/validations/request/couriers";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CourierCardList from "./courier-card-list";
import { TableOrder } from "./orders-table";

interface PageProps {
    isSheetOpen: boolean;
    setIsSheetOpen: (value: boolean) => void;
    side?: "top" | "bottom" | "left" | "right";
    order: TableOrder;
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
    const [allCourierResponse, setAllCourierResponse] = useState(undefined);
    const [recommendedCourierForShiping, setRecommendedCourierForShiping] =
        useState<ApiResponse<CourierListResponse> | undefined>(undefined);
    const [selectedCourier, setSelectedCourier] =
        useState<GetCourierForDeliveryLocation | null>(null);
    const [serviceabilityParams, setServiceabilityParams] =
        useState<initialShippingAvaibilityParams | null>(null);

    useEffect(() => {
        const fetchCouriers = async () => {
            setLoading(true);
            try {
                // Refetch address details first
                await refetchCustomerAddress();
                await refetchBrandAddress();

                // Prepare the params properly
                const initialParams: initialShippingAvaibilityParams = {
                    pickup_postcode: `${brandAddressDetails?.warehousePostalCode ?? ""}`,
                    delivery_postcode: `${customerAddressDetails?.zip ?? ""}`,
                    order_id: `${order.shiprocketOrderId ?? ""}`,
                };

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
            }
        };
        if (isSheetOpen) fetchCouriers();
    }, [isSheetOpen]);
    console.log("customerAddressDetails", customerAddressDetails);
    console.log("brandAddressDetails", brandAddressDetails);
    console.log("orders", order);
    return (
        <>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                                console.log("Selected Courier:", courier);
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
