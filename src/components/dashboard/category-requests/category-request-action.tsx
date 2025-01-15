"use client";

import {
    CategoryRequestApproveModal,
    CategoryRequestRejectModal,
    CategoryRequestViewModal,
} from "@/components/globals/modals";
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
import { TableCategoryRequest } from "./category-requests-table";

interface PageProps {
    request: TableCategoryRequest;
}

export function CategoryRequestAction({ request }: PageProps) {
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

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
                        <DropdownMenuItem
                            onClick={() => setIsViewModalOpen(true)}
                        >
                            <Icons.Eye className="size-4" />
                            View
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() => setIsApproveModalOpen(true)}
                        >
                            <Icons.CircleCheck className="size-4" />
                            Approve
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => setIsRejectModalOpen(true)}
                        >
                            <Icons.X className="size-4" />
                            Reject
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <CategoryRequestViewModal
                request={request}
                isOpen={isViewModalOpen}
                setIsOpen={setIsViewModalOpen}
            />

            <CategoryRequestApproveModal
                request={request}
                isOpen={isApproveModalOpen}
                setIsOpen={setIsApproveModalOpen}
            />

            <CategoryRequestRejectModal
                request={request}
                isOpen={isRejectModalOpen}
                setIsOpen={setIsRejectModalOpen}
            />
        </>
    );
}
