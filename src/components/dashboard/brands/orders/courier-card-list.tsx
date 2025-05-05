import { GetCourierForDeliveryLocation } from "@/actions/shiprocket/types/CourierContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { IndianRupee } from "lucide-react";

interface CourierCardListProps {
    couriers: GetCourierForDeliveryLocation[];
    onCourierSelect?: (courier: GetCourierForDeliveryLocation) => void; // new prop
    selectedCourierId?: number;
}

// Dummy wrapper to render courier list from API
export default function CourierCardList({ couriers, selectedCourierId, onCourierSelect }: CourierCardListProps) {
    return (
        <ScrollArea className="h-[calc(100vh-200px)] w-full pr-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {couriers.map((courier) => (
                    <Card
                        key={courier.courier_company_id}
                        onClick={() => onCourierSelect?.(courier)}
                        className={cn(
                            "relative cursor-pointer border transition-shadow hover:shadow-lg",
                            courier.courier_company_id === selectedCourierId
                                ? "border-green-700 ring-2 ring-green-400"
                                : ""
                        )}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold capitalize text-primary">
                                {courier.courier_name}
                                <Badge variant="outline" className="uppercase">
                                    {courier.city}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-2">
                            <div className="col-span-2 flex items-center justify-between text-sm text-muted-foreground">
                                <span>Rate</span>
                                <span className="flex items-center gap-1 text-xl font-bold text-green-600">
                                    <IndianRupee className="h-4 w-4" />
                                    {courier.rate}
                                </span>
                            </div>
                            <div className="col-span-1 text-sm">
                                <div className="text-xs text-muted-foreground">
                                    RTO Charges
                                </div>
                                ₹{courier.rto_charges}
                            </div>
                            <div className="col-span-1 text-sm">
                                <div className="text-xs text-muted-foreground">
                                    RTO Performance
                                </div>
                                ⭐ {courier.rto_performance}/5
                            </div>
                            <div className="col-span-1 text-sm">
                                <div className="text-xs text-muted-foreground">
                                    Tracking
                                </div>
                                {courier.realtime_tracking}
                            </div>
                            <div className="col-span-1 text-sm">
                                <div className="text-xs text-muted-foreground">
                                    ETD
                                </div>
                                {courier.etd} ({courier.etd_hours} hrs)
                            </div>
                            <div className="col-span-1 text-sm">
                                <div className="text-xs text-muted-foreground">
                                    Est. Days
                                </div>
                                {courier.estimated_delivery_days} Days
                            </div>
                            <div className="col-span-1 text-sm">
                                <div className="text-xs text-muted-foreground">
                                    Delivery Perf.
                                </div>
                                <div className="h-14 w-14">
                                    <ProgressCircle
                                        value={courier.delivery_performance}
                                        max={5}
                                        strokeWidth={5}
                                        className="text-blue-500"
                                        label={
                                            <span className="text-xs font-semibold">
                                                {courier.delivery_performance}/5
                                            </span>
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </ScrollArea>
    );
}
