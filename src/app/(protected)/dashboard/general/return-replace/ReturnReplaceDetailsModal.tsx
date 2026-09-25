"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog-general";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface ReturnReplaceDetailsModalProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

export function ReturnReplaceDetailsModal({
  open,
  onClose,
  data,
}: ReturnReplaceDetailsModalProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [costAllocation, setCostAllocation] = useState<string>("");
  const [rtoFaultOwner, setRtoFaultOwner] = useState<string>("");
  const [notes, setNotes] = useState("");

  const attributionQuery = trpc.general.returnReplace.getAttributionContext.useQuery(
    { requestId: data?.id ?? "" },
    { enabled: open && Boolean(data?.id) }
  );
  const setReturnAttribution = trpc.general.returnReplace.setReturnAttribution.useMutation({
    onSuccess: () => attributionQuery.refetch(),
    onError: () => attributionQuery.refetch(),
  });
  const setRtoAttribution = trpc.general.returnReplace.setRtoAttribution.useMutation({
    onSuccess: () => attributionQuery.refetch(),
    onError: () => attributionQuery.refetch(),
  });

  useEffect(() => {
    setCostAllocation(attributionQuery.data?.refund?.costAllocation ?? "");
    setRtoFaultOwner(attributionQuery.data?.rto?.faultOwner ?? "");
    setNotes("");
  }, [attributionQuery.data?.refund?.costAllocation, attributionQuery.data?.rto?.faultOwner]);

  if (!data) return null;

  const images: string[] = Array.isArray(data.images) ? data.images : [];
  const auditHistory = attributionQuery.data?.auditHistory ?? [];

  return (
    <>
      {/* MAIN MODAL */}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {data.requestType === "return"
                ? "Return Request"
                : "Replace Request"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            {/* DETAILS */}
            <div className="space-y-1">
              <p>
                <span className="font-semibold">Order ID:</span>{" "}
                {data.orderId}
              </p>
              <p>
                <span className="font-semibold">Reason:</span>{" "}
                {data.reason ?? "—"}
              </p>
              <p>
                <span className="font-semibold">Comment:</span>{" "}
                {data.comment || "—"}
              </p>

              {data.requestType === "replace" && (
                <p>
                  <span className="font-semibold">New Variant:</span>{" "}
                  {data.newVariantId}
                </p>
              )}
            </div>

            {/* IMAGES */}
            {images.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold">Uploaded Images</p>

                <div className="grid grid-cols-3 gap-4">
                  {images.map((url, index) => (
         <button
                      key={index}
                      onClick={() => {
                        onClose(); // 👈 close main modal
                        setPreviewImage(url); // 👈 open zoom
                      }}
                    className="relative h-40 w-40 overflow-hidden rounded-xl border bg-muted hover:opacity-90 transition"
                    >

                      <img
                        src={url}
                        alt={`Return image ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={() => setFailedImages((previous) => new Set(previous).add(index))}
                      />
                      {failedImages.has(index) && (
                        <span className="absolute inset-0 flex items-center justify-center bg-muted px-2 text-xs text-muted-foreground">
                          Image unavailable
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Click an image to view in full size
                </p>
              </div>
            )}

            {images.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No images were uploaded for this request.
              </p>
            )}

            {attributionQuery.data?.refund && (
              <section className="space-y-3 rounded-lg border p-3">
                <div>
                  <p className="font-semibold">Return attribution</p>
                  <p className="text-xs text-muted-foreground">
                    Customer reason: {data.reason ?? "Not provided"}. Financial ownership is determined by review.
                  </p>
                </div>
                <label className="block text-xs font-medium">
                  Determined by review
                  <select
                    className="mt-1 w-full rounded-md border bg-background p-2 text-sm"
                    value={costAllocation}
                    disabled={!attributionQuery.data.canManageRefunds || setReturnAttribution.isPending}
                    onChange={(event) => setCostAllocation(event.target.value)}
                  >
                    <option value="">Select attribution</option>
                    <option value="brand_fault">Brand fault</option>
                    <option value="customer_fault">Customer fault</option>
                    <option value="renivet_fault">Renivet fault</option>
                    <option value="carrier_fault">Carrier fault</option>
                  </select>
                </label>
                {attributionQuery.data.canManageRefunds && (
                  <>
                    <textarea
                      className="min-h-20 w-full rounded-md border bg-background p-2 text-sm"
                      placeholder="Review notes (required for reclassification, Renivet fault, or carrier fault)"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                    <button
                      type="button"
                      className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                      disabled={!costAllocation || setReturnAttribution.isPending}
                      onClick={() => setReturnAttribution.mutate({
                        requestId: data.id,
                        costAllocation: costAllocation as "brand_fault" | "customer_fault" | "renivet_fault" | "carrier_fault",
                        notes: notes || undefined,
                      })}
                    >
                      Save attribution
                    </button>
                  </>
                )}
                {setReturnAttribution.error && <p className="text-xs text-red-600">{setReturnAttribution.error.message}</p>}
              </section>
            )}

            {attributionQuery.data?.rto && (
              <section className="space-y-3 rounded-lg border p-3">
                <div>
                  <p className="font-semibold">RTO attribution</p>
                  <p className="text-xs text-muted-foreground">Use the carrier disposition as the source of truth.</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>RTO reason: {attributionQuery.data.rto.rtoReason}</p>
                  <p>Recovery decision: {attributionQuery.data.rto.recoveryDecision}</p>
                </div>
                <select
                  className="w-full rounded-md border bg-background p-2 text-sm"
                  value={rtoFaultOwner}
                  disabled={!attributionQuery.data.canManageRto || setRtoAttribution.isPending}
                  onChange={(event) => setRtoFaultOwner(event.target.value)}
                >
                  <option value="customer">Customer</option>
                  <option value="carrier">Carrier</option>
                  <option value="brand">Brand</option>
                  <option value="renivet">Renivet</option>
                  <option value="unknown">Unknown</option>
                </select>
                {attributionQuery.data.canManageRto && (
                  <button
                    type="button"
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                    disabled={!rtoFaultOwner || setRtoAttribution.isPending}
                    onClick={() => setRtoAttribution.mutate({
                      requestId: data.id,
                      faultOwner: rtoFaultOwner as "customer" | "carrier" | "brand" | "renivet" | "unknown",
                      notes: notes || undefined,
                    })}
                  >
                    Save RTO attribution
                  </button>
                )}
                {setRtoAttribution.error && <p className="text-xs text-red-600">{setRtoAttribution.error.message}</p>}
              </section>
            )}

            {auditHistory.length > 0 && (
              <section className="space-y-2 rounded-lg border p-3">
                <p className="font-semibold">Attribution history</p>
                {auditHistory.map((entry) => (
                  <div key={entry.id} className="text-xs text-muted-foreground">
                    {new Date(entry.timestampUtc).toLocaleString("en-IN")} · {entry.actorId ?? "System"}
                  </div>
                ))}
              </section>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* FULLSCREEN IMAGE PREVIEW */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-6 right-6 rounded-full bg-black/70 p-2 text-white hover:bg-black"
            onClick={() => setPreviewImage(null)}
          >
            <X size={20} />
          </button>

          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onError={() => setPreviewImage(null)}
          />
        </div>
      )}
    </>
  );
}
