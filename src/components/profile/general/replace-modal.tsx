"use client";
import { AlertDialog, AlertDialogContent, AlertDialogHeader,
AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from "@/components/ui/alert-dialog-general";
import { Button } from "@/components/ui/button-general";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select-general";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { toast } from "sonner";
import { handleClientError } from "@/lib/utils";

export function ReplaceModal({ orderItem, isOpen, onClose }) {
  const [variant, setVariant] = useState<string | null>(null);

  // Fetch VARIANTS from your product router
  const { data: variants } = trpc.brands.products.getProduct.useQuery({
    productId: orderItem.product.id
  });
console.log(variants, "variants");
  const { mutate, isPending } = trpc.general.returnReplace.create.useMutation({
    onSuccess: () => {
      toast.success("Replacement request submitted!");
      onClose();
    },
    onError: handleClientError
  });

  if (!orderItem) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>

        <AlertDialogHeader>
          <AlertDialogTitle>Replace Item</AlertDialogTitle>
          <AlertDialogDescription>Select a size/variant</AlertDialogDescription>
        </AlertDialogHeader>

        <Select onValueChange={setVariant}>
          <SelectTrigger>
            <SelectValue placeholder="Choose variant" />
          </SelectTrigger>

<SelectContent>
  {variants?.variants?.map((v) => {
    // Extract actual option values using "combinations"
    const optionLabels = Object.entries(v.combinations).map(
      ([optionId, valueId]) => {
        const option = variants.options.find((o) => o.id === optionId);
        if (!option) return null;

        const value = option.values.find((val) => val.id === valueId);
        if (!value) return null;

        return value.name; // e.g. "Blue" or "L"
      }
    ).filter(Boolean);

    // If both color + size exist → "Blue — L"
    const displayLabel = optionLabels.join(" — ");

    return (
      <SelectItem value={v.id} key={v.id}>
        {displayLabel}
        {v.quantity > 0 ? " (In Stock)" : " (Out of Stock)"}
      </SelectItem>
    );
  })}
</SelectContent>

        </Select>

        <AlertDialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>

          <Button
            disabled={!variant || isPending}
            onClick={() =>
              mutate({
                orderId: orderItem.orderId,
                orderItemId: orderItem.id,
                brandId: orderItem.product.brand.id,
                requestType: "replace",
                newVariantId: variant
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
