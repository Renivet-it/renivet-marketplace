"use client";

import { TagManageForm } from "@/components/globals/forms";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog-dash";
import { useState } from "react";

export function TagManageModal() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Icons.PlusCircle className="size-5" />
                    Create New Tag
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle asChild>
                        <p className="text-xl font-semibold">Create New Tag</p>
                    </DialogTitle>
                    <DialogDescription>
                        Fill out the form below to create a new tag
                    </DialogDescription>
                </DialogHeader>

                <TagManageForm setIsOpen={setIsOpen} />
            </DialogContent>
        </Dialog>
    );
}
