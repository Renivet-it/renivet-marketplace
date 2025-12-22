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
import { useUploadThing } from "@/lib/uploadthing"; // 👈 UploadThing hook

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

  // ✅ UploadThing (endpoint name must match backend)
const { startUpload } = useUploadThing("brandMediaUploader");

  const { mutate, isPending } =
    trpc.general.returnReplace.create.useMutation({
      onSuccess: () => {
        toast.success("Return request submitted!");
        onClose();
      },
      onError: handleClientError,
    });

  if (!orderItem) return null;

  /* -----------------------------
     FILE HANDLERS
  ------------------------------*/
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;

    const selected = Array.from(e.target.files);

    // Max 5 images
    const allowed = selected.slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...allowed]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* -----------------------------
     SUBMIT HANDLER
  ------------------------------*/
  const handleSubmit = async () => {
    if (!reason) return;

    try {
      setUploading(true);

      let imageUrls: string[] = [];

      if (files.length > 0) {
        const uploaded = await startUpload(files);

        if (!uploaded) {
          throw new Error("Upload failed");
        }

        // ✅ Extract UploadThing URLs
        imageUrls = uploaded.map((file) => file.url);
      }

      // ✅ Send URLs as JSON (perfect for jsonb)
      mutate({
        orderId: orderItem.orderId,
        orderItemId: orderItem.id,
        brandId: orderItem.product.brand.id,
        requestType: "return",
        reason,
        comment,
        images: imageUrls, // 👈 jsonb column
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Return Item</AlertDialogTitle>
          <AlertDialogDescription>
            Please tell us why you want to return this item.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Reason */}
        <Select onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="wrong_item">Wrong Item</SelectItem>
            <SelectItem value="damaged">Damaged Product</SelectItem>
            <SelectItem value="quality_issue">Quality Issue</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Comment */}
        <textarea
          className="w-full border p-2 rounded text-sm"
          placeholder="Comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Upload images (optional, max 5)
          </label>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm"
          />

          {/* 🔍 Bigger previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative h-28 w-28 rounded-lg border overflow-hidden"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 rounded bg-black/60 px-2 text-xs text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button
            disabled={!reason || isPending || uploading}
            onClick={handleSubmit}
          >
            {uploading || isPending ? "Submitting..." : "Submit"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
