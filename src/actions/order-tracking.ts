"use server";

import { orderQueries } from "@/lib/db/queries";

export type TrackingScan = {
    status: string;
    detail: string;
    time: string;
};

export async function getOrderTrackingByAwb(awb: string) {
    const order = await orderQueries.getOrderByAwb(awb);
    return order;
}

export async function getLiveTrackingByAwb(awb: string): Promise<TrackingScan[]> {
    if (!awb || !process.env.DELHIVERY_TOKEN) return [];

    try {
        const resp = await fetch(
            `https://track.delhivery.com/api/v1/packages/json/?waybill=${awb}`,
            {
                headers: {
                    Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
                },
                cache: "no-store",
            }
        );

        const data = await resp.json();
        const rawScans =
            data?.ShipmentData?.[0]?.Shipment?.Scans ??
            data?.ShipmentData?.[0]?.Shipment?.ShipmentScan ??
            [];

        const normalized = rawScans
            .map((item: any) => {
                const scanDetail = item?.ScanDetail ?? item;
                const status =
                    scanDetail?.Scan ?? item?.Scan ?? scanDetail?.Status ?? "Unknown";
                const detail =
                    scanDetail?.Instructions ??
                    scanDetail?.ScanDetail ??
                    item?.ScanDetail?.Instructions ??
                    "";
                const time =
                    scanDetail?.ScanDateTime ??
                    scanDetail?.StatusDateTime ??
                    item?.ScanDateTime ??
                    null;

                return { status, detail, time };
            })
            .filter((scan: any) => scan.status || scan.detail || scan.time)
            .sort((a: any, b: any) => {
                if (!a.time && !b.time) return 0;
                if (!a.time) return -1;
                if (!b.time) return 1;
                return new Date(a.time).getTime() - new Date(b.time).getTime();
            });

        return normalized.map((scan: any) => ({
            status: scan.status,
            detail: scan.detail,
            time: scan.time
                ? new Date(scan.time).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                  })
                : "",
        }));
    } catch (error) {
        console.error("Failed to fetch live shipment tracking:", error);
        return [];
    }
}
