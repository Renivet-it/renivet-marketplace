"use client";

import { TableCategoryRequest } from "@/components/dashboard/category-requests";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { DialogHeader } from "@/components/ui/dialog-general";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    request: TableCategoryRequest;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function CategoryRequestViewModal({
    request,
    isOpen,
    setIsOpen,
}: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {request.brandName}&apos;s Category Request
                    </DialogTitle>
                </DialogHeader>

                <p
                    dangerouslySetInnerHTML={{
                        __html: request.content.replace(
                            /(?:\r\n|\r|\n)/g,
                            "<br />"
                        ),
                    }}
                    className="text-sm"
                />
            </DialogContent>
        </Dialog>
    );
}
