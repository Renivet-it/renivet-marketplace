"use client";

import { Button } from "@/components/ui/button-dash";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog-dash";
import { useState } from "react";
import { PackingTypeForm } from "./packing-type-form";

export function PackingTypesPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Add Packing Type
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Packing Type</DialogTitle>
          </DialogHeader>

          <PackingTypeForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
