"use client";

import { TableProduct } from "@/components/dashboard/brands/products";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    product: TableProduct;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function ProductRejectionViewModal({
    product,
    isOpen,
    setIsOpen,
}: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rejection Reason</DialogTitle>
                </DialogHeader>

                <p
                    className="text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{
                        __html:
                            product.rejectionReason?.replace(
                                /(?:\r\n|\r|\n)/g,
                                "<br />"
                            ) || "N/A",
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
