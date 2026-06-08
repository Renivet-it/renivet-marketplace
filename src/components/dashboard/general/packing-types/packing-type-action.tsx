"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { toast } from "sonner";
import { PackingTypeForm } from "./packing-type-form";

export function PackingTypeAction({
    packingType,
}: {
    packingType: { id: string };
}) {
    const utils = trpc.useUtils();
    const [open, setOpen] = useState(false);

    const deleteMutation = trpc.general.packingTypes.delete.useMutation({
        onSuccess: () => {
            toast.success("Packing type deleted");
            utils.general.packingTypes.getAll.invalidate();
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
                        onClick={() =>
                            deleteMutation.mutate({ id: packingType.id })
                        }
                    >
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Packing Type</DialogTitle>
                    </DialogHeader>

                    <PackingTypeForm
                        id={packingType.id}
                        onSuccess={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
