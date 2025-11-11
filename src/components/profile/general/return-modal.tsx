"use client";
import { AlertDialog, AlertDialogContent, AlertDialogHeader,
AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog-general";
import { Button } from "@/components/ui/button-general";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select-general";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { handleClientError } from "@/lib/utils";

export function ReturnModal({ orderItem, isOpen, onClose }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  const { mutate, isPending } = trpc.general.returnReplace.create.useMutation({
    onSuccess: () => {
      toast.success("Return request submitted!");
      onClose();
    },
    onError: handleClientError
  });

  if (!orderItem) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>

        <AlertDialogHeader>
          <AlertDialogTitle>Return Item</AlertDialogTitle>
          <AlertDialogDescription>Why do you want to return?</AlertDialogDescription>
        </AlertDialogHeader>

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

        <textarea
          className="w-full border p-2 rounded"
          placeholder="Comment (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
        ></textarea>

        <AlertDialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>

          <Button
            disabled={!reason || isPending}
            onClick={() =>
              mutate({
                orderId: orderItem.orderId,
                orderItemId: orderItem.id,
                brandId: orderItem.product.brand.id,
                requestType: "return",
                reason,
                comment
              })
            }
          >
            Submit
          </Button>
        </AlertDialogFooter>

      </AlertDialogContent>
    </AlertDialog>
  );
}
