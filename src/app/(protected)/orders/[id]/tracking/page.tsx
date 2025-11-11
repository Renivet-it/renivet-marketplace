"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-general";
import Link from "next/link";
import { CheckCircle, Dot, Package, Truck, Home, Circle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

/** INTERNAL STATUS FLOW */
const UI_STATUS_FLOW = [
  { key: "pending", label: "Order Created", icon: Package },
  { key: "pickup_scheduled", label: "Pickup Scheduled", icon: Package },
  { key: "pickup_completed", label: "Package Picked", icon: Package },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
  { key: "failed", label: "Delivery Attempt Failed", icon: Circle },
  { key: "rto_initiated", label: "RTO Initiated", icon: Truck },
  { key: "rto_delivered", label: "Returned to Origin", icon: Truck },
  { key: "cancelled", label: "Cancelled", icon: Circle },
];

export default function TrackingPage() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("trackingOrder");
    if (stored) setOrder(JSON.parse(stored));
  }, []);

  const awb =
    order?.shipments?.[0]?.awbNumber !== undefined
      ? order.shipments[0].awbNumber
      : "";

  const { data: liveTracking } = trpc.general.returnReplace.trackShipment.useQuery(
    { awb },
    { enabled: Boolean(awb) }
  );

  if (!order) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <p className="text-muted-foreground text-sm">Loading tracking...</p>
      </div>
    );
  }

  const shipment = order.shipments[0];
  const currentStatus = shipment.status || "pending";
  const currentIndex = UI_STATUS_FLOW.findIndex(
    (s) => s.key === currentStatus
  );

  return (
    <div className="max-w-4xl mx-auto py-6 md:py-10 space-y-8 md:space-y-6">

      {/* HEADER */}
      <Card className="rounded-xl shadow-sm border bg-white/80 backdrop-blur p-4 md:p-6">
        <CardHeader className="pb-2">
          <h1 className="text-xl md:text-2xl font-bold">Track Your Order</h1>
          <p className="text-sm text-muted-foreground">Real-time shipment updates</p>
        </CardHeader>

        <CardContent className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="font-semibold text-sm md:text-base">{order.id}</p>
          </div>

          <Badge className="px-3 py-1 text-xs md:text-sm">
            {currentStatus.replaceAll("_", " ")}
          </Badge>
        </CardContent>
      </Card>

      {/* INTERNAL STATUS TIMELINE */}
      <Card className="rounded-xl shadow-sm p-4 md:p-6">
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Delivery Progress</h2>
        </CardHeader>

        <CardContent>
          <div className="space-y-4 md:space-y-3 relative">
            <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gray-200"></div>

            {UI_STATUS_FLOW.map((step, index) => {
              const Icon = step.icon;
              const isDone = index <= currentIndex;

              return (
                <div key={step.key} className="relative pl-16">
                  <div
                    className={`absolute left-4 top-1 w-5 h-5 md:w-6 md:h-6 rounded-full grid place-items-center border-2 ${
                      isDone
                        ? "bg-green-600 border-green-600 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {isDone ? <CheckCircle size={12} /> : <Dot size={14} />}
                  </div>

                  <p
                    className={`font-medium text-sm md:text-base ${
                      isDone ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    <Icon size={14} className="inline-block mr-2" />
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* LIVE COURIER UPDATES */}
      <Card className="rounded-xl shadow-sm p-4 md:p-6">
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Live Courier Updates</h2>
        </CardHeader>

        <CardContent>
          {liveTracking?.length ? (
            <div className="space-y-4 relative">
              <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gray-200"></div>

              {liveTracking.map((ev, i) => (
                <div key={i} className="relative pl-16">
                  <div className="absolute left-4 top-1 w-3 h-3 bg-blue-500 rounded-full"></div>

                  <p className="font-medium text-gray-800 text-sm md:text-base">
                    {ev.status}
                  </p>
                  <p className="text-xs text-muted-foreground ml-1">{ev.detail}</p>
                  <p className="text-[11px] text-gray-400 ml-1">{ev.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No updates available.</p>
          )}
        </CardContent>
      </Card>

      {/* SHIPMENT DETAILS */}
      <Card className="rounded-xl shadow-sm p-4 md:p-6">
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Shipment Details</h2>
        </CardHeader>

        <CardContent className="space-y-4 text-sm md:text-base">
          <InfoRow label="Courier" value="Delhivery" />
          <InfoRow label="AWB Number" value={<Badge>{shipment.awbNumber}</Badge>} />

          <Button asChild variant="secondary" className="w-full">
            <Link href={`https://www.delhivery.com/track-v2/package/${shipment.awbNumber}`} target="_blank">
              View on Delhivery Website
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* ITEMS */}
      <Card className="rounded-xl shadow-sm p-4 md:p-6">
        <CardHeader className="pb-3">
          <h2 className="text-lg font-semibold">Items</h2>
        </CardHeader>

        <CardContent className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
              <img
                src={item.product.media?.[0]?.mediaItem?.url}
                className="w-16 h-16 object-cover rounded-lg border"
              />

              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm md:text-base">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
