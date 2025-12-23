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
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { handleClientError } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { X, UploadCloud } from "lucide-react";

interface ReturnModalProps {
  orderItem: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ReturnModal({ orderItem, isOpen, onClose }: ReturnModalProps) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
const utils = trpc.useUtils();

  const { startUpload } = useUploadThing("brandMediaUploader");

const { mutate, isPending } =
  trpc.general.returnReplace.create.useMutation({
    onSuccess: async () => {
      toast.success("Return request submitted!");

      // 🔥 THIS IS THE IMPORTANT PART
      await utils.general.orders.getOrdersByUserId.invalidate();

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
     SUBMIT (IMAGES REQUIRED)
  ------------------------------*/
  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a return reason");
      return;
    }

    // ✅ Mandatory image validation
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
        requestType: "return",
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
            Return Item
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Upload images to help us review your return request.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 mt-4">
          {/* Reason */}
          <Select onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Select return reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wrong_item">Wrong Item Received</SelectItem>
              <SelectItem value="damaged">Product Damaged</SelectItem>
              <SelectItem value="quality_issue">Quality Issue</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Comment */}
          <textarea
            className="w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Add a comment (optional)"
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

            {/* Image previews */}
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
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Inline validation hint */}
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
            disabled={!reason || files.length === 0 || isPending || uploading}
            onClick={handleSubmit}
            className="min-w-28"
          >
            {uploading || isPending ? "Submitting..." : "Submit Return"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
