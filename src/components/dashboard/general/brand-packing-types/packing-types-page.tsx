"use client";

import { Button } from "@/components/ui/button-dash";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog-dash";
import { useState } from "react";
import { BrandProductPackingForm } from "./packing-type-form";

export function BrandProductPackingPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Add Packing Rule
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Packing Rule</DialogTitle>
          </DialogHeader>

          <BrandProductPackingForm
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
