"use client";

import { TableSubCategory } from "@/components/dashboard/general/sub-categories";
import { SubCategoryManageForm } from "@/components/globals/forms";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    subCategory?: TableSubCategory;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function SubCategoryManageModal({
    subCategory,
    isOpen,
    setIsOpen,
}: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle asChild>
                        <p className="text-xl font-semibold">
                            {subCategory ? "Edit" : "Create New"} Sub Category
                        </p>
                    </DialogTitle>
                    <DialogDescription>
                        {subCategory
                            ? "Fill out the form below to edit the sub-category"
                            : "Fill out the form below to create a new sub-category"}
                    </DialogDescription>
                </DialogHeader>

                <SubCategoryManageForm
                    subCategory={subCategory}
                    setIsOpen={setIsOpen}
                />
            </DialogContent>
        </Dialog>
    );
}
