"use client";

import {
    BanReasonViewModal,
    BanRemoveModal,
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
import { TableBan } from "./bans-table";

interface PageProps {
    ban: TableBan;
}

export function BanAction({ ban }: PageProps) {
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isUnbanModalOpen, setIsUnbanModalOpen] = useState(false);

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
                            <span>Show reason</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => setIsUnbanModalOpen(true)}>
                        <Icons.CircleCheck className="size-4" />
                        <span>Unban</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <BanReasonViewModal
                ban={ban}
                isOpen={isViewModalOpen}
                setIsOpen={setIsViewModalOpen}
            />

            <BanRemoveModal
                ban={ban}
                isOpen={isUnbanModalOpen}
                setIsOpen={setIsUnbanModalOpen}
            />
        </>
    );
}
