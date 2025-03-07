"use client";

import { InviteCreateForm } from "@/components/globals/forms";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    brandId: string;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function InviteCreateModal({ brandId, isOpen, setIsOpen }: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle asChild>
                        <p className="text-xl font-semibold">
                            Create New Invite
                        </p>
                    </DialogTitle>
                    <DialogDescription>
                        If no changes are made, the invite will expire in 7
                        days, with infinite uses.
                    </DialogDescription>
                </DialogHeader>

                <InviteCreateForm brandId={brandId} setIsOpen={setIsOpen} />
            </DialogContent>
        </Dialog>
    );
}
