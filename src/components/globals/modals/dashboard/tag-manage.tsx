"use client";

import { TableTag } from "@/components/dashboard/general/tags";
import { TagManageForm } from "@/components/globals/forms";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog-dash";
import { Dispatch, SetStateAction } from "react";

interface PageProps {
    tag?: TableTag;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export function TagManageModal({ tag, isOpen, setIsOpen }: PageProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle asChild>
                        <p className="text-xl font-semibold">
                            {tag ? "Edit" : "Create New"} Tag
                        </p>
                    </DialogTitle>
                    <DialogDescription>
                        {tag
                            ? "Fill out the form below to edit the tag"
                            : "Fill out the form below to create a new tag"}
                    </DialogDescription>
                </DialogHeader>

                <TagManageForm tag={tag} setIsOpen={setIsOpen} />
            </DialogContent>
        </Dialog>
    );
}
