"use client";

import { TableCategory } from "@/components/dashboard/general/categories";
import { CategoryManageForm } from "@/components/globals/forms";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    category?: TableCategory;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function CategoryManageModal({
    category,
    isOpen,
    setIsOpen,
}: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle asChild>
                        <p className="text-xl font-semibold">
                            {category ? "Edit" : "Create New"} Category
                        </p>
                    </DialogTitle>
                    <DialogDescription>
                        {category
                            ? "Fill out the form below to edit the category"
                            : "Fill out the form below to create a new category"}
                    </DialogDescription>
                </DialogHeader>

                <CategoryManageForm category={category} setIsOpen={setIsOpen} />
            </DialogContent>
        </Dialog>
    );
}
