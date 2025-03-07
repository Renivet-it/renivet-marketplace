"use client";

import {
    AdvertisementDeleteModal,
    AdvertisementPositionModal,
    AdvertisementStatusModal,
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
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { TableAdvertisement } from "./advertisements-table";

interface PageProps {
    advertisement: TableAdvertisement;
}

export function AdvertisementAction({ advertisement }: PageProps) {
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
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
                        <DropdownMenuItem
                            onClick={() => handleCopyId(advertisement.id)}
                        >
                            <Icons.Copy className="size-4" />
                            <span>Copy ID</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link
                                href={`/dashboard/general/advertisements/a/${advertisement.id}`}
                            >
                                <Icons.Edit className="size-4" />
                                <span>Edit</span>
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            disabled={!advertisement.isPublished}
                            onClick={() => setIsPositionModalOpen(true)}
                        >
                            <Icons.ArrowUpDown className="size-4" />
                            <span>Change Position</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => setIsStatusModalOpen(true)}
                        >
                            {advertisement.isPublished ? (
                                <Icons.LockKeyhole className="size-4" />
                            ) : (
                                <Icons.LockKeyholeOpen className="size-4" />
                            )}
                            <span>
                                {advertisement.isPublished
                                    ? "Unpublish"
                                    : "Publish"}
                            </span>
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

            <AdvertisementStatusModal
                advertisement={advertisement}
                isOpen={isStatusModalOpen}
                setIsOpen={setIsStatusModalOpen}
            />

            <AdvertisementPositionModal
                isOpen={isPositionModalOpen}
                setIsOpen={setIsPositionModalOpen}
            />

            <AdvertisementDeleteModal
                advertisement={advertisement}
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
            />
        </>
    );
}
