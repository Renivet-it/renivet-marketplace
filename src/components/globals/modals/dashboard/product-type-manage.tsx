"use client";

import { TableProductType } from "@/components/dashboard/general/product-types";
import { ProductTypeManageForm } from "@/components/globals/forms";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    productType?: TableProductType;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function ProductTypeManageModal({
    productType,
    isOpen,
    setIsOpen,
}: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle asChild>
                        <p className="text-xl font-semibold">
                            {productType ? "Edit" : "Create New"} Product Type
                        </p>
                    </DialogTitle>
                    <DialogDescription>
                        {productType
                            ? "Fill out the form below to edit the product type"
                            : "Fill out the form below to create a new product type"}
                    </DialogDescription>
                </DialogHeader>

                <ProductTypeManageForm
                    productType={productType}
                    setIsOpen={setIsOpen}
                />
            </DialogContent>
        </Dialog>
    );
}
