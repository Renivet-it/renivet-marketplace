"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog-general";
import { Button } from "@/components/ui/button-general";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select-general";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { toast } from "sonner";
import { handleClientError } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { UploadCloud, X } from "lucide-react";

interface ReplaceModalProps {
  orderItem: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ReplaceModal({
  orderItem,
  isOpen,
  onClose,
}: ReplaceModalProps) {
  const [variant, setVariant] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const { startUpload } = useUploadThing("brandMediaUploader");

  // Fetch product + variants
  const { data: product, isLoading } =
    trpc.brands.products.getProduct.useQuery(
      { productId: orderItem?.product?.id },
      { enabled: !!orderItem }
    );

  const { mutate, isPending } =
    trpc.general.returnReplace.create.useMutation({
      onSuccess: () => {
        toast.success("Replacement request submitted!");
        onClose();
      },
      onError: handleClientError,
    });

  if (!orderItem) return null;

  /* -----------------------------
     FILE HANDLERS
  ------------------------------*/
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selected = Array.from(e.target.files);
    const allowed = selected.slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...allowed]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* -----------------------------
     SUBMIT
  ------------------------------*/
  const handleSubmit = async () => {
    if (!variant) {
      toast.error("Please select a replacement variant");
      return;
    }

    if (!reason) {
      toast.error("Please select a replacement reason");
      return;
    }

    // ✅ Images mandatory (same rule as return)
    if (files.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    try {
      setUploading(true);

      const uploaded = await startUpload(files);
      if (!uploaded) throw new Error("Upload failed");

      const imageUrls = uploaded.map((f) => f.url);

      mutate({
        orderId: orderItem.orderId,
        orderItemId: orderItem.id,
        brandId: orderItem.product.brand.id,
        requestType: "replace",
        newVariantId: variant,
        reason,
        comment,
        images: imageUrls, // jsonb
      });
    } catch (err) {
      toast.error("Image upload failed");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-xl rounded-xl p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold">
            Replace Item
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Select a replacement variant and upload images for verification.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 mt-4">
          {/* Variant */}
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Replacement variant <span className="text-red-500">*</span>
            </p>

            <Select onValueChange={setVariant}>
              <SelectTrigger>
                <SelectValue placeholder="Choose variant" />
              </SelectTrigger>

              <SelectContent>
                {isLoading && (
                  <SelectItem value="loading" disabled>
                    Loading variants...
                  </SelectItem>
                )}

                {product?.variants?.map((v) => {
                  const labels = Object.entries(v.combinations)
                    .map(([optionId, valueId]) => {
                      const option = product.options.find(
                        (o) => o.id === optionId
                      );
                      const value = option?.values.find(
                        (val) => val.id === valueId
                      );
                      return value?.name;
                    })
                    .filter(Boolean);

                  return (
                    <SelectItem
                      key={v.id}
                      value={v.id}
                      disabled={v.quantity <= 0}
                    >
                      {labels.join(" — ")}
                      {v.quantity > 0
                        ? " (In Stock)"
                        : " (Out of Stock)"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Replacement reason <span className="text-red-500">*</span>
            </p>

            <Select onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wrong_size">Wrong Size</SelectItem>
                <SelectItem value="wrong_color">Wrong Color</SelectItem>
                <SelectItem value="damaged">Damaged Product</SelectItem>
                <SelectItem value="quality_issue">Quality Issue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comment */}
          <textarea
            className="w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Additional comments (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          {/* Upload Area */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Upload images <span className="text-red-500">*</span>
            </p>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted p-6 text-center hover:bg-muted/40 transition">
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-muted-foreground">
                At least 1 image required • Max 5
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-4 pt-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative h-32 w-32 rounded-xl border bg-muted overflow-hidden"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length === 0 && (
              <p className="text-xs text-red-500">
                Please upload at least one image to proceed
              </p>
            )}
          </div>
        </div>

        <AlertDialogFooter className="mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={
              !variant ||
              !reason ||
              files.length === 0 ||
              isPending ||
              uploading
            }
            onClick={handleSubmit}
            className="min-w-32"
          >
            {uploading || isPending
              ? "Submitting..."
              : "Submit Replacement"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
