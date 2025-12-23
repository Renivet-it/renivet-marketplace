"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog-general";
import { useState } from "react";
import { X } from "lucide-react";

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

  if (!data) return null;

  const images: string[] = Array.isArray(data.images) ? data.images : [];

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
                      />
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
          />
        </div>
      )}
    </>
  );
}
