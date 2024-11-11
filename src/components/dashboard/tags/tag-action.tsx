"use client";

import { TagDeleteModal, TagManageModal } from "@/components/globals/modals";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-dash";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import { TableTag } from "./tags-table";

interface PageProps {
    tag: TableTag;
}

export function TagAction({ tag }: PageProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        return toast.success("ID copied to clipboard");
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <Icons.MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                    <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => handleCopyId(tag.id)}>
                            <Icons.Copy className="size-4" />
                            <span>Copy ID</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            <Icons.Edit className="size-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => setIsDeleteModalOpen(true)}
                    >
                        <Icons.Trash className="size-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <TagManageModal
                tag={tag}
                isOpen={isEditModalOpen}
                setIsOpen={setIsEditModalOpen}
            />

            <TagDeleteModal
                tag={tag}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />
        </>
    );
}
