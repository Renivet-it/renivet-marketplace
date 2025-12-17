"use client";

import { Button } from "@/components/ui/button-dash";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog-dash";
import { Icons } from "@/components/icons";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { useState } from "react";
import { BrandProductPackingForm } from "./packing-type-form";
import { TableBrandProductPacking } from "./packing-types-table";

export function BrandProductPackingAction({
  row,
}: {
  row: TableBrandProductPacking;
}) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);

  const deleteMutation =
    trpc.general.brandProductTypePacking.delete.useMutation({
      onSuccess: () => {
        toast.success("Rule deleted");
        utils.general.brandProductTypePacking.getAll.invalidate();
      },
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <Icons.MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpen(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => deleteMutation.mutate({ id: row.id })}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Packing Rule</DialogTitle>
          </DialogHeader>

          <BrandProductPackingForm
            id={row.id}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
