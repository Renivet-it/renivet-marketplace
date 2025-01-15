"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Dispatch, SetStateAction } from "react";
import { RequestCategoryForm } from "../../forms";

interface PageProps {
    brandId: string;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function RequestCategoryModal({
    brandId,
    isOpen,
    setIsOpen,
}: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request a Category</DialogTitle>
                    <DialogDescription>
                        Request a category for your brand. We will review your
                        request and get back to you as soon as possible.
                    </DialogDescription>
                </DialogHeader>

                <RequestCategoryForm brandId={brandId} setIsOpen={setIsOpen} />
            </DialogContent>
        </Dialog>
    );
}
