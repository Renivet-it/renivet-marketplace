"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog-dash";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

export function OrderIntentDetailsModal({
  open,
  onClose,
  title,
  data,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  data: any;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] p-2">
          {data ? (
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-scroll whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-500 italic">No data available</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
