"use client";

import { Button } from "@/components/ui/button-dash";
import { Input } from "@/components/ui/input-dash";
import { trpc } from "@/lib/trpc/client";
import { formatINR, handleClientError } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";
import { toast } from "sonner";

export function BrandCorporateWorkspace({
    brandId,
    initialData,
}: {
    brandId: string;
    initialData: any;
}) {
    const utils = trpc.useUtils();
    const { startUpload } = useUploadThing("corporateDocumentUploader");
    const [qcFiles, setQcFiles] = useState<File[]>([]);
    const [shipmentDrafts, setShipmentDrafts] = useState<Record<string, any>>({});

    const submitQc = trpc.general.corporatePlatform.submitQc.useMutation({
        onSuccess: async () => {
            toast.success("QC submitted");
            await utils.general.corporatePlatform.listBrandAssignedOrders.invalidate({
                brandId,
            });
        },
        onError: (error) => handleClientError(error),
    });

    const saveShipment = trpc.general.corporatePlatform.saveShipment.useMutation({
        onSuccess: async () => {
            toast.success("Shipment updated");
            await utils.general.corporatePlatform.listBrandAssignedOrders.invalidate({
                brandId,
            });
        },
        onError: (error) => handleClientError(error),
    });

    const uploadAndSubmitQc = async (orderId: string) => {
        try {
            if (qcFiles.length === 0) return toast.error("Add QC images first");
            const uploaded = await startUpload(qcFiles);
            const images =
                uploaded?.map((file) => ({
                    name: file.name,
                    size: file.size,
                    url: file.url,
                    key: file.key,
                    type: (file as any).type ?? "application/octet-stream",
                })) ?? [];

            await submitQc.mutateAsync({
                orderId,
                remarks: "QC evidence uploaded from brand workspace",
                sampleCoveragePercent: 10,
                images,
            });
        } catch (error) {
            handleClientError(error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Assigned Quotes</h2>
                    <div className="mt-4 space-y-3">
                        {initialData.quotes.map((quote: any) => (
                            <div key={quote.id} className="rounded-xl border border-slate-200 px-4 py-3">
                                <div className="font-semibold text-slate-900">{quote.quoteNumber}</div>
                                <div className="mt-1 text-sm text-slate-500">
                                    {quote.status} • {formatINR(quote.totalAmountPaise)}
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                    {quote.profile?.companyName ?? "Profile unavailable"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">QC Submission</h2>
                    <div className="mt-4 space-y-3">
                        <input
                            type="file"
                            multiple
                            className="block w-full text-sm"
                            onChange={(e) => setQcFiles(Array.from(e.target.files ?? []))}
                        />
                        {initialData.orders.length ? (
                            initialData.orders.map((order: any) => (
                                <Button key={order.id} onClick={() => uploadAndSubmitQc(order.id)}>
                                    Submit QC For {order.publicOrderId}
                                </Button>
                            ))
                        ) : (
                            <div className="text-sm text-slate-500">
                                Order assignment wiring is still pending for brand-side operational orders.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Dispatch Updates</h2>
                <div className="mt-4 space-y-4">
                    {initialData.orders.length ? (
                        initialData.orders.map((order: any) => (
                            <div key={order.id} className="rounded-xl border border-slate-200 p-4">
                                <div className="font-semibold text-slate-900">{order.publicOrderId}</div>
                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                    <Input
                                        placeholder="Courier"
                                        value={shipmentDrafts[order.id]?.courierName ?? ""}
                                        onChange={(e) =>
                                            setShipmentDrafts((current) => ({
                                                ...current,
                                                [order.id]: {
                                                    ...current[order.id],
                                                    courierName: e.target.value,
                                                },
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Tracking number"
                                        value={shipmentDrafts[order.id]?.trackingNumber ?? ""}
                                        onChange={(e) =>
                                            setShipmentDrafts((current) => ({
                                                ...current,
                                                [order.id]: {
                                                    ...current[order.id],
                                                    trackingNumber: e.target.value,
                                                },
                                            }))
                                        }
                                    />
                                    <Input
                                        placeholder="Tracking URL"
                                        value={shipmentDrafts[order.id]?.trackingUrl ?? ""}
                                        onChange={(e) =>
                                            setShipmentDrafts((current) => ({
                                                ...current,
                                                [order.id]: {
                                                    ...current[order.id],
                                                    trackingUrl: e.target.value,
                                                },
                                            }))
                                        }
                                    />
                                </div>
                                <Button
                                    className="mt-3"
                                    onClick={() =>
                                        saveShipment.mutate({
                                            orderId: order.id,
                                            courierName:
                                                shipmentDrafts[order.id]?.courierName ?? null,
                                            trackingNumber:
                                                shipmentDrafts[order.id]?.trackingNumber ?? null,
                                            trackingUrl:
                                                shipmentDrafts[order.id]?.trackingUrl ?? null,
                                            status: "dispatched",
                                            provider: "manual",
                                        })
                                    }
                                >
                                    Mark Dispatched
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-slate-500">
                            Dispatch entry will become active once normalized brand order assignment is completed.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

