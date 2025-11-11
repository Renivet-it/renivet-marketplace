"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog-general";

export function ReturnReplaceDetailsModal({
  open,
  onClose,
  data
}: {
  open: boolean;
  onClose: () => void;
  data: any;
}) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {data.requestType === "return" ? "Return Request" : "Replace Request"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p><b>Order ID:</b> {data.orderId}</p>
          <p><b>Reason:</b> {data.reason ?? "—"}</p>
          <p><b>Comment:</b> {data.comment ?? "—"}</p>
          {data.requestType === "replace" && (
            <p><b>New Variant:</b> {data.newVariantId}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
