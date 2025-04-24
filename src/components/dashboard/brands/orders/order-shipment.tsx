"use client";

import {
    ApiResponse,
    CourierListResponse,
    GetCourierForDeliveryLocation,
} from "@/actions/shiprocket/types/CourierContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { IndianRupee, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { string } from "zod";
import CourierCardList from "./courier-card-list";
import { TableOrder } from "./orders-table";

interface PageProps {
    isSheetOpen: boolean;
    setIsSheetOpen: (value: boolean) => void;
    side?: "top" | "bottom" | "left" | "right";
    order: TableOrder;
}

export default function OrderShipment({
    isSheetOpen,
    setIsSheetOpen,
    side = "right",
    order,
}: PageProps) {
    const { data: customerAddressDetails, refetch } =
        trpc.general.addresses.getAddressById.useQuery(
            {
                addressId: order.addressId,
            },
            {
                enabled: false, // prevent auto-fetching if needed
            }
        );
    const [loading, setLoading] = useState(false);
    const [allCourierResponse, setAllCourierResponse] = useState(undefined);
    const [recommendedCourierForShiping, setRecommendedCourierForShiping] =
        useState<ApiResponse<CourierListResponse> | undefined>(undefined);
    const [selectedCourier, setSelectedCourier] =
        useState<GetCourierForDeliveryLocation | null>(null);

    useEffect(() => {
        const fetchCouriers = async () => {
            try {
                setLoading(true);
                const res1 = await fetch("/api/shiprocket/couriers");
                const params = new URLSearchParams({
                    pickup_postcode: "734004",
                    delivery_postcode: "734001",
                    cod: "0", // or "0"
                    weight: "0.5",
                    order_id: `${order.shiprocketOrderId ?? ""}`,
                }).toString();
                const res2 = await fetch(
                    `/api/shiprocket/couriers/serviceability?${params}`
                );
                await refetch();
                setAllCourierResponse(await res1.json());
                setRecommendedCourierForShiping(await res2.json());
            } catch (err) {
                toast.error("Something went wrong");
            } finally {
                setLoading(false);
            }
        };
        if (isSheetOpen) fetchCouriers();
    }, [isSheetOpen]);
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
