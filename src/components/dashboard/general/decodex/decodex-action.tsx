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
import { DecodeXForm } from "./decodex-form";
import type { TableDecodeXRow } from "./decodex-table";

export function DecodeXAction({ row }: { row: TableDecodeXRow }) {
    const utils = trpc.useUtils();
    const [open, setOpen] = useState(false);

    const deleteMutation = trpc.general.decodex.delete.useMutation({
        onSuccess: () => {
            toast.success("DecodeX profile deleted");
            utils.general.decodex.getAll.invalidate();
        },
        onError: (error) => toast.error(error.message),
    });

    const onDelete = () => {
        const isConfirmed = window.confirm(
            "Delete this DecodeX profile? This action cannot be undone."
        );

        if (!isConfirmed) return;
        deleteMutation.mutate({ id: row.id });
    };

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
                    <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Edit DecodeX Profile</DialogTitle>
                    </DialogHeader>

                    <DecodeXForm id={row.id} onSuccess={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}

