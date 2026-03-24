"use client";

import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { useState } from "react";
import { DecodeXForm } from "./decodex-form";

export function DecodeXPage() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setOpen(true)}>Add DecodeX Profile</Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-5xl">
                    <DialogHeader>
                        <DialogTitle>Create DecodeX Profile</DialogTitle>
                    </DialogHeader>

                    <DecodeXForm onSuccess={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </>
    );
}
